import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { RecallModel, type Recall } from "@/models/Recall";
import { requireClinic, requirePermission } from "./access.service";
import { NotificationService } from "./notification.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateRecallInput {
  patientId: string;
  type?: "cleaning" | "checkup" | "rct" | "implant" | "orthodontic" | "follow_up" | "other";
  reason?: string;
  dueDate: string;
  channel?: "sms" | "whatsapp" | "email" | "call";
  note?: string;
}

export async function listRecalls(
  context: TenantContext,
  opts: { page?: number; limit?: number; status?: string } = {}
): Promise<{ items: Recall[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "recalls.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.status) filter.status = opts.status;
  const [total, docs] = await Promise.all([
    RecallModel.countDocuments(filter),
    RecallModel.find(filter).sort({ dueDate: 1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createRecall(context: TenantContext, input: CreateRecallInput): Promise<Recall> {
  await connectDB();
  requirePermission(context, "recalls.manage");
  const clinicId = await requireClinic(context);
  const recall = await RecallModel.create({
    clinicId: new Types.ObjectId(clinicId),
    patientId: new Types.ObjectId(input.patientId),
    type: input.type ?? "checkup",
    reason: input.reason ?? "",
    dueDate: new Date(input.dueDate),
    channel: input.channel ?? "sms",
    status: "scheduled",
    note: input.note ?? "",
  });
  return recall;
}

export async function sendRecall(context: TenantContext, id: string): Promise<Recall> {
  await connectDB();
  requirePermission(context, "recalls.manage");
  const clinicId = await requireClinic(context);
  const recall = await RecallModel.findOne({ _id: id, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!recall) throw ApiError.notFound("Recall not found");
  try {
    await NotificationService.send(context, {
      to: recall.patientId.toString(),
      channel: recall.channel as "sms" | "whatsapp" | "email",
      template: "appointment_reminder",
      body: `Reminder: ${recall.type} due ${recall.dueDate.toISOString().slice(0, 10)}`,
    });
  } catch {
    /* stub / dev fallback logs */
  }
  const updated = await RecallModel.findOneAndUpdate(
    { _id: id },
    { $set: { status: "sent", sentAt: new Date() } },
    { new: true }
  ).lean();
  return updated!;
}
