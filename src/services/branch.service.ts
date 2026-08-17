import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { BranchModel, type Branch } from "@/models/Branch";
import { requireClinic, requirePermission } from "./access.service";
import type { TenantContext } from "@/types";

export interface CreateBranchInput {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export async function listBranches(context: TenantContext): Promise<Branch[]> {
  await connectDB();
  requirePermission(context, "clinic.view");
  const clinicId = await requireClinic(context);
  return BranchModel.find({ clinicId: new Types.ObjectId(clinicId), isActive: true }).sort({ name: 1 }).lean();
}

export async function createBranch(context: TenantContext, input: CreateBranchInput): Promise<Branch> {
  await connectDB();
  requirePermission(context, "clinic.manage");
  const clinicId = await requireClinic(context);
  const branch = await BranchModel.create({
    clinicId: new Types.ObjectId(clinicId),
    name: input.name,
    code: input.code ?? "",
    address: input.address ?? "",
    city: input.city ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
    isActive: true,
  });
  return branch;
}

export async function deleteBranch(context: TenantContext, id: string): Promise<void> {
  await connectDB();
  requirePermission(context, "clinic.manage");
  const clinicId = await requireClinic(context);
  const res = await BranchModel.deleteOne({ _id: id, clinicId: new Types.ObjectId(clinicId) }).exec();
  if (res.deletedCount === 0) throw ApiError.notFound("Branch not found");
}
