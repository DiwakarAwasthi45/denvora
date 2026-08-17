import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { InventoryModel, type InventoryItem } from "@/models/Inventory";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext, PaginationMeta } from "@/types";

export interface CreateInventoryInput {
  name: string;
  category?: string;
  sku?: string;
  quantity?: number;
  reorderLevel?: number;
  unit?: string;
  unitCost?: number;
  expiryDate?: string | null;
  supplier?: string;
}

export async function listInventory(
  context: TenantContext,
  opts: { page?: number; limit?: number; category?: string; lowStock?: boolean } = {}
): Promise<{ items: InventoryItem[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "inventory.view");
  const clinicId = await requireClinic(context);
  const co = new Types.ObjectId(clinicId);
  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);
  const filter: Record<string, unknown> = { clinicId: co };
  if (opts.category) filter.category = opts.category;
  if (opts.lowStock) filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  const [total, docs] = await Promise.all([
    InventoryModel.countDocuments(filter),
    InventoryModel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return { items: docs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createInventoryItem(context: TenantContext, input: CreateInventoryInput): Promise<InventoryItem> {
  await connectDB();
  requirePermission(context, "inventory.manage");
  const clinicId = await requireClinic(context);
  const item = await InventoryModel.create({
    clinicId: new Types.ObjectId(clinicId),
    name: input.name,
    category: input.category ?? "General",
    sku: input.sku ?? "",
    quantity: input.quantity ?? 0,
    reorderLevel: input.reorderLevel ?? 0,
    unit: input.unit ?? "pcs",
    unitCost: input.unitCost ?? 0,
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    supplier: input.supplier ?? "",
  });
  return item;
}

export async function adjustInventory(
  context: TenantContext,
  id: string,
  delta: number
): Promise<InventoryItem> {
  await connectDB();
  requirePermission(context, "inventory.manage");
  const clinicId = await requireClinic(context);
  const item = await InventoryModel.findOneAndUpdate(
    { _id: id, clinicId: new Types.ObjectId(clinicId) },
    { $inc: { quantity: delta } },
    { new: true }
  ).lean();
  if (!item) throw ApiError.notFound("Item not found");
  return item;
}

export async function predictStockOut(): Promise<void> {
  return;
}
