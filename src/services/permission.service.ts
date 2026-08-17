import { connectDB } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/api";
import { PermissionModel } from "@/models/Permission";
import { RoleModel } from "@/models/Role";
import { SYSTEM_ROLES } from "@/constants/roles";
import { PERMISSIONS } from "@/constants/permissions";
import { Types } from "mongoose";

let seedingPromise: Promise<void> | null = null;

export async function seedPermissions(): Promise<void> {
  await connectDB();
  const entries = Object.entries(PERMISSIONS).map(([key, label]) => ({
    key,
    module: key.split(".")[0],
    label,
  }));
  const bulk = entries.map((entry) => ({
    updateOne: {
      filter: { key: entry.key },
      update: { $setOnInsert: entry },
      upsert: true,
    },
  }));
  if (bulk.length) await PermissionModel.bulkWrite(bulk);
}

export async function seedPlatformRoles(): Promise<void> {
  await connectDB();
  const superAdmin = SYSTEM_ROLES.super_admin;
  await RoleModel.updateOne(
    { slug: superAdmin.slug, clinicId: null },
    {
      $setOnInsert: {
        slug: superAdmin.slug,
        name: superAdmin.name,
        description: superAdmin.description,
        isSystem: true,
        isPlatform: true,
        permissions: superAdmin.permissions,
      },
    },
    { upsert: true }
  );
}

export async function seedSystemRolesForClinic(clinicId: string): Promise<void> {
  await connectDB();
  const roles = Object.values(SYSTEM_ROLES).filter((role) => !role.isPlatform);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const bulk = roles.map((role) => ({
    updateOne: {
      filter: { clinicId: clinicObjectId, slug: role.slug },
      update: {
        $setOnInsert: {
          clinicId: clinicObjectId,
          slug: role.slug,
          name: role.name,
          description: role.description,
          isSystem: true,
          isPlatform: false,
          permissions: role.permissions,
        },
      },
      upsert: true,
    },
  }));

  if (bulk.length) await RoleModel.bulkWrite(bulk);
}

export async function getRoleBySlug(clinicId: string | null, slug: string) {
  await connectDB();
  return RoleModel.findOne({
    clinicId: clinicId ? new Types.ObjectId(clinicId) : null,
    slug,
  }).lean();
}

export async function getPlatformSuperAdminRole() {
  await connectDB();
  return RoleModel.findOne({ slug: "super_admin", clinicId: null }).lean();
}

export async function listClinicRoles(clinicId: string) {
  await connectDB();
  return RoleModel.find({ clinicId: new Types.ObjectId(clinicId) })
    .sort({ isSystem: -1, name: 1 })
    .lean();
}

export async function ensureSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    await seedPermissions();
    await seedPlatformRoles();
  })().catch((err) => {
    seedingPromise = null;
    throw err;
  });
  return seedingPromise;
}

export function assertRoleFound(role: unknown, slug: string): asserts role is NonNullable<typeof role> {
  if (!role) {
    throw new ApiError(`System role "${slug}" is not seeded`, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
}
