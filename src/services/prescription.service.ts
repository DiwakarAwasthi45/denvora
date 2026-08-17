import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { PrescriptionModel } from "@/models/Prescription";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreatePrescriptionInput {
  patientId: string;
  dentistId?: string | null;
  appointmentId?: string | null;
  items: Array<{ medicine: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }>;
  notes?: string;
  status?: "draft" | "issued" | "dispensed";
}

export async function listPrescriptions(
  context: TenantContext,
  opts: { page?: number; limit?: number; patientId?: string } = {}
): Promise<{ items: unknown[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "prescriptions.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.patientId) filter.patientId = new Types.ObjectId(opts.patientId);
  const [total, docs] = await Promise.all([
    PrescriptionModel.countDocuments(filter),
    PrescriptionModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createPrescription(context: TenantContext, input: CreatePrescriptionInput): Promise<unknown> {
  await connectDB();
  requirePermission(context, "prescriptions.create");
  const clinicId = await requireClinic(context);
  const prescription = await PrescriptionModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    dentistId: input.dentistId ? new Types.ObjectId(input.dentistId) : null,
    appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : null,
    items: input.items,
    notes: input.notes ?? "",
    status: input.status ?? "issued",
  });
  return prescription;
}
