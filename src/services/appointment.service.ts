import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { AppointmentModel } from "@/models/Appointment";
import { PatientModel } from "@/models/Patient";
import { UserModel } from "@/models/User";
import { ChairModel } from "@/models/Chair";
import { ServiceModel } from "@/models/Service";
import { requireClinic, requirePermission } from "./access.service";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TRANSITIONS, TERMINAL_STATUSES, type AppointmentStatus } from "@/constants/appointments";
import type { TenantContext, PaginationMeta, SafeAppointment } from "@/types";
import type { CreateAppointmentInput, UpdateAppointmentInput } from "@/validations/appointment.schema";

interface AppointmentFilter {
  clinicId: Types.ObjectId;
  date?: string;
  status?: AppointmentStatus;
  patientId?: { $in: Types.ObjectId[] };
}

function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function toSafeAppointment(
  doc: Record<string, unknown>,
  patients: Map<string, { name: string; phone?: string }>,
  users: Map<string, string>,
  chairs: Map<string, string>,
  services: Map<string, string>,
  queueIndex?: Map<string, number>
): SafeAppointment {
  const patientId = String(doc.patientId);
  const dentistId = doc.dentistId ? String(doc.dentistId) : null;
  const chairId = doc.chairId ? String(doc.chairId) : null;
  const serviceId = doc.serviceId ? String(doc.serviceId) : null;
  const patient = patients.get(patientId);
  const start = doc.startTime as string;
  const end = doc.endTime as string;

  return {
    id: String(doc._id),
    patientId,
    patientName: patient?.name ?? "Unknown patient",
    patientPhone: patient?.phone ?? "",
    dentistId,
    dentistName: dentistId ? users.get(dentistId) ?? null : null,
    chairId,
    chairName: chairId ? chairs.get(chairId) ?? null : null,
    serviceId,
    date: doc.date as string,
    startTime: start,
    endTime: end,
    durationMinutes: durationMinutes(start, end),
    type: (doc.type as string) ?? "consultation",
    status: (doc.status as string) ?? "scheduled",
    reason: (doc.reason as string) ?? "",
    notes: (doc.notes as string) ?? "",
    checkedInAt: doc.checkedInAt ? (doc.checkedInAt as Date).toISOString() : null,
    cancelReason: (doc.cancelReason as string) ?? "",
    queuePosition: queueIndex ? queueIndex.get(String(doc._id)) : undefined,
    createdAt: doc.createdAt ? (doc.createdAt as Date).toISOString() : undefined,
    updatedAt: doc.updatedAt ? (doc.updatedAt as Date).toISOString() : undefined,
  };
}

export async function hydrateAppointments(
  docs: Array<Record<string, unknown>>,
  queueIndex?: Map<string, number>
): Promise<SafeAppointment[]> {
  const patientIds = [...new Set(docs.map((d) => String(d.patientId)))];
  const userIds = [...new Set(docs.map((d) => (d.dentistId ? String(d.dentistId) : null)).filter(Boolean))] as string[];
  const chairIds = [...new Set(docs.map((d) => (d.chairId ? String(d.chairId) : null)).filter(Boolean))] as string[];
  const serviceIds = [...new Set(docs.map((d) => (d.serviceId ? String(d.serviceId) : null)).filter(Boolean))] as string[];

  const [patients, users, chairs, services] = await Promise.all([
    patientIds.length ? PatientModel.find({ _id: { $in: patientIds } }).select("_id name phone").lean() : [],
    userIds.length ? UserModel.find({ _id: { $in: userIds } }).select("_id name").lean() : [],
    chairIds.length ? ChairModel.find({ _id: { $in: chairIds } }).select("_id name").lean() : [],
    serviceIds.length ? ServiceModel.find({ _id: { $in: serviceIds } }).select("_id name").lean() : [],
  ]);

  const patientMap = new Map(patients.map((p) => [String(p._id), { name: p.name, phone: p.phone ?? "" }]));
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));
  const chairMap = new Map(chairs.map((c) => [String(c._id), c.name]));
  const serviceMap = new Map(services.map((s) => [String(s._id), s.name]));

  return docs.map((doc) => toSafeAppointment(doc, patientMap, userMap, chairMap, serviceMap, queueIndex));
}

async function assertChairOverlap(
  clinicObjectId: Types.ObjectId,
  chairId: string | null,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<void> {
  if (!chairId) return;
  const filter: Record<string, unknown> = {
    clinicId: clinicObjectId,
    chairId: new Types.ObjectId(chairId),
    date,
    status: { $nin: TERMINAL_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) };
  const overlap = await AppointmentModel.findOne(filter).select("_id").lean();
  if (overlap) throw ApiError.conflict("This chair is already booked during that time");
}

async function assertPatientInClinic(clinicObjectId: Types.ObjectId, patientId: string): Promise<void> {
  const patient = await PatientModel.findOne({ _id: patientId, clinicId: clinicObjectId }).select("_id").lean();
  if (!patient) throw ApiError.badRequest("Validation failed", { patientId: ["Select a valid patient"] });
}

async function assertUserInClinic(clinicObjectId: Types.ObjectId, userId: string, field: "dentistId"): Promise<void> {
  const user = await UserModel.findOne({ _id: userId, clinicId: clinicObjectId }).select("_id").lean();
  if (!user) throw ApiError.badRequest("Validation failed", { [field]: ["Select a valid team member"] });
}

async function assertChairInClinic(clinicObjectId: Types.ObjectId, chairId: string): Promise<void> {
  const chair = await ChairModel.findOne({ _id: chairId, clinicId: clinicObjectId }).select("_id").lean();
  if (!chair) throw ApiError.badRequest("Validation failed", { chairId: ["Select a valid chair"] });
}

export function assertTransition(current: string, next: string): void {
  if (current === next) return;
  const allowed = APPOINTMENT_TRANSITIONS[current as keyof typeof APPOINTMENT_TRANSITIONS] ?? [];
  if (!allowed.includes(next as never)) {
    throw ApiError.badRequest(
      `Cannot change status from ${APPOINTMENT_STATUS_LABELS[current as keyof typeof APPOINTMENT_STATUS_LABELS] ?? current} to ${
        APPOINTMENT_STATUS_LABELS[next as keyof typeof APPOINTMENT_STATUS_LABELS] ?? next
      }`,
      { status: ["Invalid status change"] }
    );
  }
}

export async function listAppointments(
  context: TenantContext,
  opts: { page?: number; limit?: number; date?: string; status?: string; search?: string } = {}
): Promise<{ items: SafeAppointment[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "appointments.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: AppointmentFilter = { clinicId: clinicObjectId };
  if (opts.date) filter.date = opts.date;
  if (opts.status) filter.status = opts.status as AppointmentStatus;
  if (opts.search) {
    const matches = await PatientModel.find({
      clinicId: clinicObjectId,
      $or: [
        { name: { $regex: opts.search, $options: "i" } },
        { phone: { $regex: opts.search, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    filter.patientId = { $in: matches.map((m) => m._id) };
  }

  const [total, docs] = await Promise.all([
    AppointmentModel.countDocuments(filter),
    AppointmentModel.find(filter)
      .sort({ date: -1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const items = await hydrateAppointments(docs);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createAppointment(context: TenantContext, input: CreateAppointmentInput): Promise<SafeAppointment> {
  await connectDB();
  requirePermission(context, "appointments.create");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  await assertPatientInClinic(clinicObjectId, input.patientId);
  if (input.dentistId) await assertUserInClinic(clinicObjectId, input.dentistId, "dentistId");
  if (input.chairId) await assertChairInClinic(clinicObjectId, input.chairId);
  await assertChairOverlap(clinicObjectId, input.chairId ?? null, input.date, input.startTime, input.endTime);

  const doc = await AppointmentModel.create({
    clinicId: clinicObjectId,
    patientId: new Types.ObjectId(input.patientId),
    dentistId: input.dentistId ? new Types.ObjectId(input.dentistId) : null,
    chairId: input.chairId ? new Types.ObjectId(input.chairId) : null,
    serviceId: input.serviceId ? new Types.ObjectId(input.serviceId) : null,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    type: input.type,
    status: input.status ?? "scheduled",
    reason: input.reason ?? "",
    notes: input.notes ?? "",
    createdBy: new Types.ObjectId(context.userId),
  });

  const [appointment] = await hydrateAppointments([doc.toObject()]);
  return appointment;
}

export async function getAppointment(context: TenantContext, appointmentId: string): Promise<SafeAppointment> {
  await connectDB();
  requirePermission(context, "appointments.view");
  const clinicId = await requireClinic(context);

  const doc = await AppointmentModel.findOne({ _id: appointmentId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!doc) throw ApiError.notFound("Appointment not found");

  const [appointment] = await hydrateAppointments([doc]);
  return appointment;
}

export async function updateAppointment(
  context: TenantContext,
  appointmentId: string,
  input: UpdateAppointmentInput
): Promise<SafeAppointment> {
  await connectDB();
  requirePermission(context, "appointments.update");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const target = await AppointmentModel.findOne({ _id: appointmentId, clinicId: clinicObjectId }).lean();
  if (!target) throw ApiError.notFound("Appointment not found");

  if (input.status && input.status !== target.status) {
    assertTransition(target.status, input.status);
  }

  const set: Record<string, unknown> = {};
  if (input.patientId !== undefined) {
    await assertPatientInClinic(clinicObjectId, input.patientId);
    set.patientId = new Types.ObjectId(input.patientId);
  }
  if (input.dentistId !== undefined) {
    set.dentistId = input.dentistId ? new Types.ObjectId(input.dentistId) : null;
    if (input.dentistId) await assertUserInClinic(clinicObjectId, input.dentistId, "dentistId");
  }
  if (input.chairId !== undefined) {
    set.chairId = input.chairId ? new Types.ObjectId(input.chairId) : null;
    if (input.chairId) await assertChairInClinic(clinicObjectId, input.chairId);
  }
  if (input.serviceId !== undefined) set.serviceId = input.serviceId ? new Types.ObjectId(input.serviceId) : null;
  if (input.date !== undefined) set.date = input.date;
  if (input.startTime !== undefined) set.startTime = input.startTime;
  if (input.endTime !== undefined) set.endTime = input.endTime;
  if (input.type !== undefined) set.type = input.type;
  if (input.reason !== undefined) set.reason = input.reason ?? "";
  if (input.notes !== undefined) set.notes = input.notes ?? "";

  if (input.status !== undefined) {
    set.status = input.status;
    if (input.status === "checked_in" && !target.checkedInAt) set.checkedInAt = new Date();
    if (input.status === "cancelled") set.cancelReason = input.cancelReason ?? "";
  }

  const nextChair = (set.chairId ?? target.chairId) ? String(set.chairId ?? target.chairId) : null;
  const nextDate = (set.date ?? target.date) as string;
  const nextStart = (set.startTime ?? target.startTime) as string;
  const nextEnd = (set.endTime ?? target.endTime) as string;
  const scheduleChanged =
    set.chairId !== undefined ||
    set.date !== undefined ||
    set.startTime !== undefined ||
    set.endTime !== undefined;
  if (scheduleChanged) {
    await assertChairOverlap(clinicObjectId, nextChair, nextDate, nextStart, nextEnd, appointmentId);
  }

  await AppointmentModel.updateOne({ _id: target._id }, { $set: set }).exec();
  const updated = await AppointmentModel.findById(target._id).lean();
  const [appointment] = await hydrateAppointments([updated ?? target]);
  return appointment;
}

export async function deleteAppointment(context: TenantContext, appointmentId: string): Promise<void> {
  await connectDB();
  requirePermission(context, "appointments.delete");
  const clinicId = await requireClinic(context);

  const target = await AppointmentModel.findOne({ _id: appointmentId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!target) throw ApiError.notFound("Appointment not found");

  await AppointmentModel.deleteOne({ _id: target._id }).exec();
}

export async function getAppointmentFormData(context: TenantContext): Promise<{
  patients: Array<{ id: string; name: string; phone?: string }>;
  staff: Array<{ id: string; name: string; role?: string }>;
  chairs: Array<{ id: string; name: string; location?: string }>;
  services: Array<{ id: string; name: string }>;
}> {
  await connectDB();
  requirePermission(context, "appointments.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const [patients, staff, chairs, services] = await Promise.all([
    PatientModel.find({ clinicId: clinicObjectId, status: "active" }).sort({ name: 1 }).limit(50).select("_id name phone").lean(),
    UserModel.find({ clinicId: clinicObjectId, status: "active" }).sort({ name: 1 }).limit(100).select("_id name role").lean(),
    ChairModel.find({ clinicId: clinicObjectId, isActive: true }).sort({ sortOrder: 1, name: 1 }).select("_id name location").lean(),
    ServiceModel.find({ clinicId: clinicObjectId, isActive: true }).sort({ name: 1 }).limit(100).select("_id name").lean(),
  ]);

  return {
    patients: patients.map((p) => ({ id: String(p._id), name: p.name, phone: p.phone ?? "" })),
    staff: staff.map((u) => ({ id: String(u._id), name: u.name, role: u.role ?? undefined })),
    chairs: chairs.map((c) => ({ id: String(c._id), name: c.name, location: c.location ?? "" })),
    services: services.map((s) => ({ id: String(s._id), name: s.name })),
  };
}
