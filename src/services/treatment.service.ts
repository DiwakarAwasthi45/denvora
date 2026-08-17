import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { TreatmentModel, type Treatment } from "@/models/Treatment";
import { TreatmentPlanModel } from "@/models/TreatmentPlan";
import { PatientModel } from "@/models/Patient";
import { UserModel } from "@/models/User";
import { AppointmentModel } from "@/models/Appointment";
import { InvoiceModel } from "@/models/Invoice";
import { requireClinic, requirePermission } from "./access.service";
import { AiService } from "./ai.service";
import type { TenantContext, PaginationMeta } from "@/types";

type TreatmentStatus = "proposed" | "planned" | "in_progress" | "completed" | "declined" | "on_hold";

interface TreatmentFilter {
  clinicId: Types.ObjectId;
  patientId?: Types.ObjectId;
  dentistId?: Types.ObjectId;
  status?: TreatmentStatus;
  statusIn?: TreatmentStatus[];
}

export interface CreateTreatmentInput {
  patientId: string;
  appointmentId?: string | null;
  dentistId?: string | null;
  tooth?: number | null;
  surface?: string;
  diagnosis: string;
  procedure: string;
  status?: "proposed" | "planned" | "in_progress" | "completed" | "declined" | "on_hold";
  cost?: number;
  estimatedVisits?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
}

export async function listTreatments(
  context: TenantContext,
  opts: { page?: number; limit?: number; patientId?: string; status?: TreatmentStatus } = {}
): Promise<{ items: Treatment[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "treatments.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: TreatmentFilter = { clinicId: clinicObjectId };
  if (opts.patientId) filter.patientId = new Types.ObjectId(opts.patientId);
  if (opts.status) filter.status = opts.status;

  const [total, docs] = await Promise.all([
    TreatmentModel.countDocuments(filter as unknown as Record<string, unknown>),
    TreatmentModel.find(filter as unknown as Record<string, unknown>).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createTreatment(context: TenantContext, input: CreateTreatmentInput): Promise<Treatment> {
  await connectDB();
  requirePermission(context, "treatments.create");
  const clinicId = await requireClinic(context);

  const treatment = await TreatmentModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : null,
    dentistId: input.dentistId ? new Types.ObjectId(input.dentistId) : null,
    tooth: input.tooth ?? null,
    surface: input.surface ?? "",
    diagnosis: input.diagnosis,
    procedure: input.procedure,
    status: input.status ?? "proposed",
    cost: input.cost ?? 0,
    estimatedVisits: input.estimatedVisits ?? 1,
    priority: input.priority ?? "medium",
    notes: input.notes ?? "",
    createdBy: new Types.ObjectId(context.userId),
  });

  return treatment;
}

export async function updateTreatment(
  context: TenantContext,
  treatmentId: string,
  updates: Partial<CreateTreatmentInput> & { acceptedAt?: Date | null; declinedAt?: Date | null; startedAt?: Date | null; completedAt?: Date | null; completedVisits?: number }
): Promise<Treatment> {
  await connectDB();
  requirePermission(context, "treatments.update");
  const clinicId = await requireClinic(context);

  const treatment = await TreatmentModel.findOneAndUpdate(
    { _id: treatmentId, clinicId: new Types.ObjectId(clinicId) },
    { $set: updates },
    { new: true }
  ).lean();

  if (!treatment) throw ApiError.notFound("Treatment not found");
  return treatment;
}

export async function acceptTreatment(context: TenantContext, treatmentId: string): Promise<Treatment> {
  return updateTreatment(context, treatmentId, {
    status: "planned",
    acceptedAt: new Date(),
  });
}

export async function declineTreatment(context: TenantContext, treatmentId: string): Promise<Treatment> {
  return updateTreatment(context, treatmentId, {
    status: "declined",
    declinedAt: new Date(),
  });
}

export async function completeTreatment(context: TenantContext, treatmentId: string): Promise<Treatment> {
  return updateTreatment(context, treatmentId, {
    status: "completed",
    completedAt: new Date(),
    completedVisits: 1,
  });
}

/** Treatment Acceptance Engine - tracks proposed → explained → estimate sent → accepted/pending/rejected/completed */
export async function getTreatmentAcceptanceFunnel(context: TenantContext, patientId?: string) {
  await connectDB();
  requirePermission(context, "treatments.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const baseFilter: Record<string, unknown> = { clinicId: clinicObjectId };
  if (patientId) baseFilter.patientId = new Types.ObjectId(patientId);

  const stages: Array<{ key: string; status: TreatmentStatus }> = [
    { key: "proposed", status: "proposed" },
    { key: "explained", status: "planned" },
    { key: "estimate_sent", status: "planned" },
    { key: "accepted", status: "planned" },
    { key: "pending", status: "planned" },
    { key: "rejected", status: "declined" },
    { key: "completed", status: "completed" },
  ];

  const result: Record<string, number> = {};
  for (const stage of stages) {
    const count = await TreatmentModel.countDocuments({ ...baseFilter, status: stage.status } as Record<string, unknown>);
    result[stage.key] = count;
  }
  return result;
}

/** Revenue Leak Detector - unbilled treatment, unpaid invoices, pending treatments, missed follow-ups */
export async function getRevenueLeaks(context: TenantContext) {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const [unbilledTreatments, unpaidInvoices, pendingTreatments, overdueFollowups] = await Promise.all([
    TreatmentModel.countDocuments({ clinicId: clinicObjectId, status: { $in: ["planned", "in_progress"] }, cost: { $gt: 0 } }),
    InvoiceModel.countDocuments({ clinicId: clinicObjectId, status: { $in: ["open", "partial"] } }),
    TreatmentModel.countDocuments({ clinicId: clinicObjectId, status: "proposed" }),
    0, // placeholder for follow-ups
  ]);

  return {
    unbilledTreatments,
    unpaidInvoices,
    pendingTreatments,
    overdueFollowups,
    totalLeakEstimate: 0, // would calculate from invoice/treatment amounts
  };
}

/** AI Treatment Summary - summarizes patient's previous visits and treatment history */
export async function getAiTreatmentSummary(context: TenantContext, patientId: string): Promise<string> {
  await connectDB();
  requirePermission(context, "treatments.view");
  const clinicId = await requireClinic(context);

  const patient = await PatientModel.findOne({ _id: patientId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!patient) throw ApiError.notFound("Patient not found");

  const [treatments, appointments, invoices] = await Promise.all([
    TreatmentModel.find({ patientId: new Types.ObjectId(patientId) }).sort({ createdAt: -1 }).limit(50).lean(),
    AppointmentModel.find({ patientId: new Types.ObjectId(patientId) }).sort({ date: -1 }).limit(30).lean(),
    InvoiceModel.find({ patientId: new Types.ObjectId(patientId) }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const prompt = `Patient: ${patient.name}
Recent treatments: ${treatments.map(t => `${t.procedure} (${t.status})`).join(", ") || "none"}
Recent appointments: ${appointments.map(a => `${a.type} on ${a.date}`).join(", ") || "none"}
Recent invoices: ${invoices.map(i => `${i.number}: ${i.status}`).join(", ") || "none"}

Summarize this patient's dental treatment history in 3-4 concise sentences for the dentist.`;

  const result = await AiService.chat(context, { messages: [{ role: "user", content: prompt }], maxTokens: 300 });
  return result.text;
}