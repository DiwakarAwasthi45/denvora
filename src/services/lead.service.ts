import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { LeadModel, type Lead } from "@/models/Lead";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateLeadInput {
  name: string;
  phone?: string;
  email?: string;
  source?: "website" | "whatsapp" | "call" | "walk_in" | "referral" | "social" | "other";
  status?: "new" | "contacted" | "consultation" | "treatment" | "converted" | "lost";
  assignedTo?: string | null;
  notes?: string;
}

export async function listLeads(
  context: TenantContext,
  opts: { page?: number; limit?: number; status?: string } = {}
): Promise<{ items: Lead[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "leads.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.status) filter.status = opts.status;
  const [total, docs] = await Promise.all([
    LeadModel.countDocuments(filter),
    LeadModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createLead(context: TenantContext, input: CreateLeadInput): Promise<Lead> {
  await connectDB();
  requirePermission(context, "leads.manage");
  const clinicId = await requireClinic(context);
  const lead = await LeadModel.create({
    clinicId: new Types.ObjectId(clinicId),
    name: input.name,
    phone: input.phone ?? "",
    email: input.email ?? "",
    source: input.source ?? "walk_in",
    status: input.status ?? "new",
    assignedTo: input.assignedTo ? new Types.ObjectId(input.assignedTo) : null,
    notes: input.notes ?? "",
  });
  return lead;
}

export async function convertLead(context: TenantContext, id: string): Promise<Lead> {
  await connectDB();
  requirePermission(context, "leads.manage");
  const clinicId = await requireClinic(context);
  const lead = await LeadModel.findOneAndUpdate(
    { _id: id, clinicId: new Types.ObjectId(clinicId) },
    { $set: { status: "converted", convertedAt: new Date() } },
    { new: true }
  ).lean();
  if (!lead) throw ApiError.notFound("Lead not found");
  return lead;
}
