import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { DocumentModel, type Document } from "@/models/Document";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateDocumentInput {
  patientId: string;
  appointmentId?: string | null;
  type: "xray" | "report" | "consent" | "prescription" | "invoice" | "treatment_plan" | "lab_order" | "insurance" | "photo" | "other";
  title: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  tags?: string[];
}

export async function listDocuments(
  context: TenantContext,
  opts: { patientId?: string; type?: string; page?: number; limit?: number } = {}
): Promise<{ items: Document[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "documents.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: Record<string, unknown> = { clinicId: clinicObjectId };
  if (opts.patientId) filter.patientId = new Types.ObjectId(opts.patientId);
  if (opts.type) filter.type = opts.type;

  const [total, docs] = await Promise.all([
    DocumentModel.countDocuments(filter),
    DocumentModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createDocument(context: TenantContext, input: CreateDocumentInput): Promise<Document> {
  await connectDB();
  requirePermission(context, "documents.upload");
  const clinicId = await requireClinic(context);

  const doc = await DocumentModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : null,
    type: input.type,
    title: input.title,
    fileUrl: input.fileUrl,
    fileSize: input.fileSize ?? 0,
    mimeType: input.mimeType ?? "application/pdf",
    description: input.description,
    tags: input.tags ?? [],
    uploadedBy: new Types.ObjectId(context.userId),
  });

  return doc;
}

export async function deleteDocument(context: TenantContext, docId: string): Promise<void> {
  await connectDB();
  requirePermission(context, "documents.delete");
  const clinicId = await requireClinic(context);

  const result = await DocumentModel.deleteOne({ _id: docId, clinicId: new Types.ObjectId(clinicId) }).exec();
  if (result.deletedCount === 0) throw ApiError.notFound("Document not found");
}