import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { XRayModel, type XRay } from "@/models/XRay";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateXRayInput {
  patientId: string;
  appointmentId?: string | null;
  type: "bitewing" | "periapical" | "panoramic" | "cbct" | "cephalometric" | "other";
  region?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  aiTags?: string[];
}

export async function listXRays(
  context: TenantContext,
  opts: { patientId?: string; page?: number; limit?: number } = {}
): Promise<{ items: XRay[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "documents.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: Record<string, unknown> = { clinicId: clinicObjectId };
  if (opts.patientId) filter.patientId = new Types.ObjectId(opts.patientId);

  const [total, docs] = await Promise.all([
    XRayModel.countDocuments(filter),
    XRayModel.find(filter).sort({ capturedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createXRay(context: TenantContext, input: CreateXRayInput): Promise<XRay> {
  await connectDB();
  requirePermission(context, "documents.upload");
  const clinicId = await requireClinic(context);

  const xray = await XRayModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : null,
    type: input.type,
    region: input.region,
    imageUrl: input.imageUrl,
    thumbnailUrl: input.thumbnailUrl,
    description: input.description,
    aiTags: input.aiTags ?? [],
    capturedAt: new Date(),
    uploadedBy: new Types.ObjectId(context.userId),
  });

  return xray;
}

export async function deleteXRay(context: TenantContext, xrayId: string): Promise<void> {
  await connectDB();
  requirePermission(context, "documents.delete");
  const clinicId = await requireClinic(context);

  const result = await XRayModel.deleteOne({ _id: xrayId, clinicId: new Types.ObjectId(clinicId) }).exec();
  if (result.deletedCount === 0) throw ApiError.notFound("X-Ray not found");
}