import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { AppointmentModel } from "@/models/Appointment";
import { ChairModel } from "@/models/Chair";
import { requireClinic } from "./access.service";
import { assertTransition, hydrateAppointments } from "./appointment.service";
import { QUEUE_STATUSES } from "@/constants/appointments";
import type { TenantContext, SafeAppointment } from "@/types";

function requireQueueAccess(context: TenantContext): void {
  if (context.isPlatform) return;
  const has =
    context.permissions.includes("queue.manage") || context.permissions.includes("appointments.update");
  if (!has) throw ApiError.forbidden();
}

export function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function getQueue(
  context: TenantContext,
  opts: { date?: string } = {}
): Promise<{ items: SafeAppointment[]; chairs: Array<{ id: string; name: string; location?: string }> }> {
  await connectDB();
  requireQueueAccess(context);
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const date = opts.date ?? todayInTimezone("Asia/Kathmandu");

  const [docs, chairs] = await Promise.all([
    AppointmentModel.find({
      clinicId: clinicObjectId,
      date,
      status: { $in: QUEUE_STATUSES },
    })
      .sort({ checkedInAt: 1, startTime: 1 })
      .lean(),
    ChairModel.find({ clinicId: clinicObjectId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("_id name location")
      .lean(),
  ]);

  const queueIndex = new Map(docs.map((doc, index) => [String(doc._id), index + 1]));
  const items = await hydrateAppointments(docs, queueIndex);

  return {
    items,
    chairs: chairs.map((c) => ({ id: String(c._id), name: c.name, location: c.location ?? "" })),
  };
}

export async function transitionStatus(
  context: TenantContext,
  appointmentId: string,
  nextStatus: string,
  opts: { chairId?: string; cancelReason?: string } = {}
): Promise<SafeAppointment> {
  await connectDB();
  requireQueueAccess(context);
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const target = await AppointmentModel.findOne({ _id: appointmentId, clinicId: clinicObjectId }).lean();
  if (!target) throw ApiError.notFound("Appointment not found");

  assertTransition(target.status, nextStatus);

  const set: Record<string, unknown> = { status: nextStatus };
  if (opts.chairId) {
    const chair = await ChairModel.findOne({ _id: opts.chairId, clinicId: clinicObjectId }).select("_id").lean();
    if (!chair) throw ApiError.badRequest("Validation failed", { chairId: ["Select a valid chair"] });
    set.chairId = chair._id;
  }
  if (nextStatus === "checked_in" && !target.checkedInAt) set.checkedInAt = new Date();
  if (nextStatus === "cancelled") set.cancelReason = opts.cancelReason ?? "";

  await AppointmentModel.updateOne({ _id: target._id }, { $set: set }).exec();

  const updated = await AppointmentModel.findById(target._id).lean();
  const [appointment] = await hydrateAppointments([updated ?? target]);
  return appointment;
}
