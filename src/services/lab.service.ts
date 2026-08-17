import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { LabCaseModel, type LabCase } from "@/models/LabCase";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateLabCaseInput {
  patientId: string;
  dentistId?: string | null;
  labName?: string;
  description: string;
  tooth?: number | null;
  status?: "requested" | "sent" | "in_lab" | "received" | "delivered" | "cancelled";
  dueDate?: string | null;
  cost?: number;
  notes?: string;
}

export async function listLabCases(
  context: TenantContext,
  opts: { page?: number; limit?: number; status?: string } = {}
): Promise<{ items: LabCase[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "lab.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.status) filter.status = opts.status;
  const [total, docs] = await Promise.all([
    LabCaseModel.countDocuments(filter),
    LabCaseModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createLabCase(context: TenantContext, input: CreateLabCaseInput): Promise<LabCase> {
  await connectDB();
  requirePermission(context, "lab.manage");
  const clinicId = await requireClinic(context);
  const labCase = await LabCaseModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    dentistId: input.dentistId ? new Types.ObjectId(input.dentistId) : null,
    labName: input.labName ?? "",
    description: input.description,
    tooth: input.tooth ?? null,
    status: input.status ?? "requested",
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    cost: input.cost ?? 0,
    notes: input.notes ?? "",
  });
  return labCase;
}

export async function updateLabCaseStatus(
  context: TenantContext,
  id: string,
  status: LabCase["status"]
): Promise<LabCase> {
  await connectDB();
  requirePermission(context, "lab.manage");
  const clinicId = await requireClinic(context);
  const set: Record<string, unknown> = { status };
  if (status === "delivered") set.deliveredAt = new Date();
  const labCase = await LabCaseModel.findOneAndUpdate(
    { _id: id, clinicId: new Types.ObjectId(clinicId) },
    { $set: set },
    { new: true }
  ).lean();
  if (!labCase) throw ApiError.notFound("Lab case not found");
  return labCase;
}
