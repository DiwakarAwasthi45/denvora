import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { AttendanceModel, LeaveModel, CommissionModel } from "@/models/Attendance";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export async function checkIn(context: TenantContext, date: string): Promise<unknown> {
  await connectDB();
  const clinicId = await requireClinic(context);
  const doc = await AttendanceModel.findOneAndUpdate(
    { clinicId: new Types.ObjectId(clinicId), userId: new Types.ObjectId(context.userId), date },
    { $setOnInsert: { status: "present" }, $set: { checkIn: new Date() } },
    { upsert: true, new: true }
  ).lean();
  return doc;
}

export async function checkOut(context: TenantContext, date: string): Promise<unknown> {
  await connectDB();
  const clinicId = await requireClinic(context);
  const doc = await AttendanceModel.findOneAndUpdate(
    { clinicId: new Types.ObjectId(clinicId), userId: new Types.ObjectId(context.userId), date },
    { $set: { checkOut: new Date() } },
    { new: true }
  ).lean();
  if (!doc) throw ApiError.notFound("Attendance record not found");
  return doc;
}

export async function listAttendance(
  context: TenantContext,
  opts: { userId?: string; month?: string; page?: number; limit?: number } = {}
): Promise<{ items: unknown[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "users.view");
  const clinicId = await requireClinic(context);
  const filter: Record<string, unknown> = { clinicId: new Types.ObjectId(clinicId) };
  if (opts.userId) filter.userId = new Types.ObjectId(opts.userId);
  if (opts.month) {
    const start = `${opts.month}-01`;
    const end = new Date(`${opts.month}-01`);
    end.setMonth(end.getMonth() + 1);
    filter.date = { $gte: start, $lt: end.toISOString().slice(0, 10) };
  }
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 50) || 50, 1), 100);
  const [total, docs] = await Promise.all([
    AttendanceModel.countDocuments(filter),
    AttendanceModel.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function requestLeave(
  context: TenantContext,
  input: { type: "sick" | "casual" | "annual" | "emergency" | "unpaid"; startDate: string; endDate: string; reason?: string }
): Promise<unknown> {
  await connectDB();
  const clinicId = await requireClinic(context);
  const leave = await LeaveModel.create({
    clinicId: new Types.ObjectId(clinicId),
    userId: new Types.ObjectId(context.userId),
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason ?? "",
    status: "pending",
  });
  return leave;
}

export async function listCommissions(
  context: TenantContext,
  opts: { userId?: string; period?: string; page?: number; limit?: number } = {}
): Promise<{ items: unknown[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "users.view");
  const clinicId = await requireClinic(context);
  const filter: Record<string, unknown> = { clinicId: new Types.ObjectId(clinicId) };
  if (opts.userId) filter.userId = new Types.ObjectId(opts.userId);
  if (opts.period) filter.period = opts.period;
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 50) || 50, 1), 100);
  const [total, docs] = await Promise.all([
    CommissionModel.countDocuments(filter),
    CommissionModel.find(filter).sort({ period: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
