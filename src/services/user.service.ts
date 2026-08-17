import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/api";
import { UserModel } from "@/models/User";
import { RoleModel } from "@/models/Role";
import { ClinicModel } from "@/models/Clinic";
import { createOtpRecord } from "./auth.service";
import { listClinicRoles } from "./permission.service";
import { requireClinic, requirePermission } from "./access.service";
import { inviteEmail, sendMail } from "@/lib/mailer";
import { randomHex } from "@/lib/utils";
import { INVITE_TTL_MINUTES } from "./auth.service";
import { SYSTEM_ROLE_SLUGS } from "@/constants/roles";
import type { TenantContext, SafeStaff, PaginationMeta } from "@/types";
import type { CreateUserInput, UpdateUserInput } from "@/validations/user.schema";

const BCRYPT_ROUNDS = 12;

interface UserFilter {
  clinicId: Types.ObjectId;
  role?: string;
  $or?: Array<Record<string, unknown>>;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSafeStaff(user: {
  _id: unknown;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string | null;
  roleId?: unknown;
  status?: string;
  emailVerified?: boolean;
  isPlatform?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date | null;
}, roleNames?: Map<string, string>): SafeStaff {
  const roleId = user.roleId ? String(user.roleId) : null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
    role: user.role ?? null,
    roleId,
    roleName: roleNames && roleId ? roleNames.get(roleId) ?? user.role ?? null : user.role ?? null,
    status: user.status ?? "pending",
    emailVerified: user.emailVerified ?? false,
    isPlatform: user.isPlatform ?? false,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

export async function createStaffUser(context: TenantContext, input: CreateUserInput): Promise<{ user: SafeStaff; maskedEmail: string }> {
  await connectDB();
  requirePermission(context, "users.create");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const existing = await UserModel.findOne({ email: input.email }).select("_id").lean();
  if (existing) {
    throw new ApiError("A user with this email already exists", {
      statusCode: 409,
      code: ERROR_CODES.USER_EXISTS,
    });
  }

  const role = await RoleModel.findOne({ _id: input.roleId, clinicId: clinicObjectId }).lean();
  if (!role) {
    throw ApiError.badRequest("Validation failed", { roleId: ["Select a valid role for this clinic"] });
  }

  const clinic = await ClinicModel.findById(clinicId).select("name").lean();

  // Placeholder hash until the invite is accepted; never a usable password.
  const passwordHash = await bcrypt.hash(randomHex(24), BCRYPT_ROUNDS);

  const user = await UserModel.create({
    clinicId: clinicObjectId,
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    passwordHash,
    roleId: role._id,
    role: role.slug,
    permissions: role.permissions,
    status: "invited",
    emailVerified: false,
    isPlatform: false,
  });

  const otp = await createOtpRecord(user._id.toString(), "staff_invite", INVITE_TTL_MINUTES);
  await sendMail(inviteEmail(input.email, otp, clinic?.name ?? "your clinic"));

  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] Staff invite OTP for ${input.email}: ${otp}`);
  }

  return { user: toSafeStaff(user.toObject()), maskedEmail: `**@${input.email.split("@")[1] ?? ""}` };
}

export async function listClinicUsers(
  context: TenantContext,
  opts: { page?: number; limit?: number; search?: string; role?: string } = {}
): Promise<{ items: SafeStaff[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "users.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: UserFilter = { clinicId: clinicObjectId };
  if (opts.role) filter.role = opts.role;
  if (opts.search) {
    const search = escapeRegex(opts.search.trim());
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    UserModel.countDocuments(filter),
    UserModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const roles = await listClinicRoles(clinicId);
  const roleNames = new Map(roles.map((role) => [role._id.toString(), role.name]));

  return {
    items: docs.map((doc) => toSafeStaff(doc, roleNames)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClinicUser(context: TenantContext, userId: string): Promise<SafeStaff> {
  await connectDB();
  requirePermission(context, "users.view");
  const clinicId = await requireClinic(context);

  const user = await UserModel.findOne({ _id: userId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!user) throw ApiError.notFound("User not found");

  const roles = await listClinicRoles(clinicId);
  const roleNames = new Map(roles.map((role) => [role._id.toString(), role.name]));
  return toSafeStaff(user, roleNames);
}

export async function updateStaffUser(context: TenantContext, userId: string, input: UpdateUserInput): Promise<SafeStaff> {
  await connectDB();
  requirePermission(context, "users.update");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const target = await UserModel.findOne({ _id: userId, clinicId: clinicObjectId }).lean();
  if (!target) throw ApiError.notFound("User not found");

  if (target._id.toString() === context.userId) {
    throw ApiError.forbidden("You cannot modify your own account here");
  }
  if (target.role === SYSTEM_ROLE_SLUGS.CLINIC_OWNER) {
    throw ApiError.forbidden("The clinic owner cannot be modified");
  }
  if (target.isPlatform) {
    throw ApiError.forbidden("Platform users cannot be modified here");
  }

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.phone !== undefined) set.phone = input.phone;

  if (input.status !== undefined) {
    if (target.status === "invited") {
      throw ApiError.badRequest("Invited users must accept their invitation before activation", {
        status: ["Resend the invitation or delete the user"],
      });
    }
    set.status = input.status;
  }

  if (input.roleId !== undefined && input.roleId !== target.roleId?.toString()) {
    const role = await RoleModel.findOne({ _id: input.roleId, clinicId: clinicObjectId }).lean();
    if (!role) {
      throw ApiError.badRequest("Validation failed", { roleId: ["Select a valid role for this clinic"] });
    }
    set.roleId = role._id;
    set.role = role.slug;
    set.permissions = role.permissions;
  }

  await UserModel.updateOne({ _id: target._id }, { $set: set }).exec();

  const updated = await UserModel.findById(target._id).lean();
  const roles = await listClinicRoles(clinicId);
  const roleNames = new Map(roles.map((role) => [role._id.toString(), role.name]));
  return toSafeStaff(updated ?? target, roleNames);
}

export async function deleteStaffUser(context: TenantContext, userId: string): Promise<void> {
  await connectDB();
  requirePermission(context, "users.delete");
  const clinicId = await requireClinic(context);

  const target = await UserModel.findOne({ _id: userId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!target) throw ApiError.notFound("User not found");

  if (target._id.toString() === context.userId) {
    throw ApiError.forbidden("You cannot delete your own account");
  }
  if (target.role === SYSTEM_ROLE_SLUGS.CLINIC_OWNER) {
    throw ApiError.forbidden("The clinic owner cannot be deleted");
  }
  if (target.isPlatform) {
    throw ApiError.forbidden("Platform users cannot be deleted");
  }

  await UserModel.deleteOne({ _id: target._id }).exec();
}

export async function resendInvite(context: TenantContext, userId: string): Promise<{ maskedEmail: string }> {
  await connectDB();
  requirePermission(context, "users.update");
  const clinicId = await requireClinic(context);

  const target = await UserModel.findOne({ _id: userId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!target) throw ApiError.notFound("User not found");
  if (target.status !== "invited") {
    throw ApiError.badRequest("This user has already joined. Resend is only available for invited users.");
  }

  const clinic = await ClinicModel.findById(clinicId).select("name").lean();
  const otp = await createOtpRecord(target._id.toString(), "staff_invite", INVITE_TTL_MINUTES);
  await sendMail(inviteEmail(target.email, otp, clinic?.name ?? "your clinic"));

  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] Resent staff invite OTP for ${target.email}: ${otp}`);
  }

  return { maskedEmail: `**@${target.email.split("@")[1] ?? ""}` };
}
