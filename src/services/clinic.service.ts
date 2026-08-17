import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";
import { SubscriptionModel } from "@/models/Subscription";
import { APP_TRIAL_DAYS } from "@/constants/config";
import { seedSystemRolesForClinic, listClinicRoles } from "./permission.service";
import { requireClinic, requirePermission } from "./access.service";
import { Types } from "mongoose";
import { ApiError, ERROR_CODES } from "@/lib/api";
import type { TenantContext, SafeClinic } from "@/types";

export interface CreateClinicInput {
  name: string;
  email: string;
  phone?: string;
  ownerId: string;
}

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "clinic";
}

export async function createClinic(input: CreateClinicInput): Promise<{ clinicId: Types.ObjectId; slug: string }> {
  await connectDB();

  let slug = makeSlug(input.name);
  const existing = await ClinicModel.exists({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const clinic = await ClinicModel.create({
    name: input.name,
    slug,
    email: input.email,
    phone: input.phone ?? "",
    owner: new Types.ObjectId(input.ownerId),
    status: "pending",
  });

  const trialEndsAt = new Date(Date.now() + APP_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const subscription = await SubscriptionModel.create({
    clinicId: clinic._id,
    plan: "trial",
    status: "trial",
    currency: "NPR",
    trialEndsAt,
    startsAt: new Date(),
    expiresAt: trialEndsAt,
  });

  await ClinicModel.updateOne(
    { _id: clinic._id },
    { $set: { subscriptionId: subscription._id } }
  ).exec();

  await seedSystemRolesForClinic(clinic._id.toString());

  return { clinicId: clinic._id, slug: clinic.slug };
}

export async function getClinicById(id: string) {
  await connectDB();
  return ClinicModel.findById(id).lean();
}

export async function getCurrentClinic(context: TenantContext): Promise<SafeClinic> {
  await connectDB();
  requirePermission(context, "clinic.view");
  const clinicId = await requireClinic(context);
  const clinic = await getClinicById(clinicId);
  if (!clinic) throw ApiError.notFound("Clinic not found");
  return toSafeClinic(clinic);
}

export async function getClinicRoles(context: TenantContext) {
  const clinicId = await requireClinic(context);
  requirePermission(context, "roles.view");
  return listClinicRoles(clinicId);
}

export function toSafeClinic(clinic: {
  _id: unknown;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  address?: string | null;
  city?: string | null;
  status?: string;
  settings?: { currency?: string; vatEnabled?: boolean; vatRate?: number; language?: string } | null;
  timezone?: string | null;
}): SafeClinic {
  return {
    id: String(clinic._id),
    name: clinic.name,
    slug: clinic.slug,
    email: clinic.email ?? "",
    phone: clinic.phone ?? "",
    logo: clinic.logo ?? "",
    address: clinic.address ?? "",
    city: clinic.city ?? "",
    status: clinic.status ?? "pending",
    currency: clinic.settings?.currency ?? "NPR",
    timezone: clinic.timezone ?? "Asia/Kathmandu",
    vatEnabled: clinic.settings?.vatEnabled ?? false,
    vatRate: clinic.settings?.vatRate ?? 0,
    language: clinic.settings?.language ?? "en",
  };
}

export async function assertClinicActive(clinicId: string): Promise<void> {
  const clinic = await getClinicById(clinicId);
  if (!clinic || clinic.status === "suspended") {
    throw new ApiError("Clinic is not active", {
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
    });
  }
}
