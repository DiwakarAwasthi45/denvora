import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ExpenseModel, type Expense } from "@/models/Expense";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateExpenseInput {
  category?: string;
  description: string;
  amount: number;
  vendor?: string;
  date?: string | null;
  currency?: string;
}

export async function listExpenses(
  context: TenantContext,
  opts: { page?: number; limit?: number; category?: string; month?: string } = {}
): Promise<{ items: Expense[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "expenses.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.category) filter.category = opts.category;
  const [total, docs] = await Promise.all([
    ExpenseModel.countDocuments(filter),
    ExpenseModel.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createExpense(context: TenantContext, input: CreateExpenseInput): Promise<Expense> {
  await connectDB();
  requirePermission(context, "expenses.manage");
  const clinicId = await requireClinic(context);
  const expense = await ExpenseModel.create({
    clinicId: new Types.ObjectId(clinicId),
    category: input.category ?? "General",
    description: input.description,
    amount: input.amount,
    vendor: input.vendor ?? "",
    date: input.date ? new Date(input.date) : new Date(),
    currency: input.currency ?? "NPR",
    createdBy: new Types.ObjectId(context.userId),
  });
  return expense;
}

export async function expensesSummary(context: TenantContext, month?: string): Promise<{ total: number; byCategory: Record<string, number> }> {
  await connectDB();
  requirePermission(context, "expenses.view");
  const clinicId = await requireClinic(context);
  const match: Record<string, unknown> = { clinicId: new Types.ObjectId(clinicId) };
  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    match.date = { $gte: start, $lt: end };
  }
  const byCategory = await ExpenseModel.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const total = byCategory.reduce((s, x) => s + x.total, 0);
  return { total, byCategory: Object.fromEntries(byCategory.map((x) => [x._id, x.total])) };
}
