import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { AppointmentModel } from "@/models/Appointment";
import { InvoiceModel } from "@/models/Invoice";
import { TransactionModel } from "@/models/Transaction";
import { TreatmentModel } from "@/models/Treatment";
import { PatientModel } from "@/models/Patient";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext } from "@/types";

function monthRange(month?: string): { start: Date; end: Date } {
  const base = month ? new Date(`${month}-01`) : new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setMonth(end.getMonth() + 1);
  return { start: base, end };
}

export interface RevenuePoint { period: string; revenue: number; count: number; }

export async function revenueAnalytics(context: TenantContext, month?: string): Promise<{
  totalRevenue: number;
  completed: number;
  daily: RevenuePoint[];
  byMonth: RevenuePoint[];
}> {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const { start, end } = monthRange(month);

  const agg = await InvoiceModel.aggregate([
    { $match: { clinicId, createdAt: { $gte: start, $lt: end }, status: { $in: ["paid", "partial"] } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const totalRevenue = agg.reduce((s: number, x: { revenue: number }) => s + x.revenue, 0);
  const daily: RevenuePoint[] = agg.map((x: { _id: string; revenue: number; count: number }) => ({ period: x._id, revenue: x.revenue, count: x.count }));

  const byMonth = await InvoiceModel.aggregate([
    { $match: { clinicId, status: { $in: ["paid", "partial"] } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).then((r) => r.map((x: { _id: string; revenue: number; count: number }) => ({ period: x._id, revenue: x.revenue, count: x.count })));

  return { totalRevenue, completed: agg.length, daily, byMonth };
}

export async function chairUtilization(context: TenantContext): Promise<{ chairs: Array<{ chairId: string; name: string; appointments: number; hours: number }> }> {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const res = await AppointmentModel.aggregate([
    { $match: { clinicId, status: { $in: ["completed", "checked_in", "in_progress"] }, chairId: { $exists: true } } },
    { $group: { _id: "$chairId", appointments: { $sum: 1 } } },
  ]);
  return { chairs: res.map((x: { _id: string; appointments: number }) => ({ chairId: String(x._id), name: "", appointments: x.appointments, hours: 0 })) };
}

export async function treatmentAnalytics(context: TenantContext): Promise<{ total: number; byStatus: Record<string, number>; acceptanceRate: number }> {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const all = await TreatmentModel.find({ clinicId }).lean();
  const byStatus: Record<string, number> = {};
  let accepted = 0;
  for (const t of all) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    if (["planned", "in_progress", "completed"].includes(t.status)) accepted++;
  }
  const acceptanceRate = all.length ? Math.round((accepted / all.length) * 100) : 0;
  return { total: all.length, byStatus, acceptanceRate };
}

export async function noShowAnalytics(context: TenantContext): Promise<{ total: number; noShows: number; rate: number }> {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const [total, noShows] = await Promise.all([
    AppointmentModel.countDocuments({ clinicId }),
    AppointmentModel.countDocuments({ clinicId, status: "no_show" }),
  ]);
  return { total, noShows, rate: total ? Math.round((noShows / total) * 100) : 0 };
}

export async function retentionAnalytics(context: TenantContext): Promise<{ new: number; returning: number; inactive: number; lost: number }> {
  await connectDB();
  requirePermission(context, "reports.view");
  const clinicId = new Types.ObjectId(await requireClinic(context));
  const [all, returning, inactive] = await Promise.all([
    PatientModel.countDocuments({ clinicId, status: "active" }),
    AppointmentModel.distinct("patientId", { clinicId, status: { $in: ["completed", "checked_in", "in_progress"] } }),
    PatientModel.countDocuments({ clinicId, status: "inactive" }),
  ]);
  return { new: Math.max(all - returning.length, 0), returning: returning.length, inactive, lost: 0 };
}
