import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ClinicModel } from "@/models/Clinic";
import type { TenantContext } from "@/types";

/**
 * Revalidate the session against the database on every protected access.
 * Rejects stale sessions (password change via tokenVersion), disabled /
 * unverified accounts and suspended clinics, so revocations take effect
 * immediately instead of waiting for the JWT to expire.
 */
export async function validateSessionIntegrity(user: { id: string; tokenVersion?: number }): Promise<void> {
  await connectDB();

  const dbUser = await UserModel.findById(user.id)
    .select("status emailVerified tokenVersion clinicId isPlatform role roleId permissions")
    .lean();
  if (!dbUser) throw ApiError.unauthorized("Session is no longer valid. Please sign in again.");

  if (dbUser.status !== "active") throw ApiError.unauthorized("Your account is not active");
  if (!dbUser.emailVerified) throw ApiError.unauthorized("Your email is not verified");
  if ((dbUser.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
    throw ApiError.unauthorized("Session has expired. Please sign in again.");
  }

  if (dbUser.clinicId) {
    const clinic = await ClinicModel.findById(dbUser.clinicId).select("status").lean();
    if (!clinic || clinic.status === "suspended") {
      throw ApiError.unauthorized("Your clinic account is unavailable");
    }
  }
}

/**
 * Resolve the calling tenant from the active session.
 * Throws 401 when the caller is not authenticated or the session is stale.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw ApiError.unauthorized();

  await validateSessionIntegrity(user);

  return {
    userId: user.id,
    clinicId: user.clinicId ?? null,
    branchId: user.branchId ?? null,
    role: user.role ?? null,
    roleId: user.roleId ?? null,
    permissions: user.permissions ?? [],
    isPlatform: user.isPlatform ?? false,
  };
}

/**
 * Ensure the caller belongs to a clinic and return its id.
 */
export async function requireClinic(context: TenantContext): Promise<string> {
  if (!context.clinicId) {
    throw ApiError.forbidden("You are not assigned to a clinic");
  }
  return context.clinicId;
}

/**
 * Server-side authorization guard. Platform users bypass permission checks.
 */
export function requirePermission(context: TenantContext, permission: string): void {
  if (context.isPlatform) return;
  if (!context.permissions.includes(permission)) {
    throw ApiError.forbidden();
  }
}
