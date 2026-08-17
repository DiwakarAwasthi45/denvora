import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { PatientModel } from "@/models/Patient";
import { MedicalHistoryModel } from "@/models/MedicalHistory";
import { requireClinic, requirePermission } from "./access.service";
import { TOOTH_NUMBERS, type PatientStatus } from "@/constants/patients";
import type {
  TenantContext,
  PaginationMeta,
  SafePatient,
  SafePatientDetail,
  SafeMedicalHistory,
  ToothEntry,
} from "@/types";
import type { CreatePatientInput, UpdatePatientInput } from "@/validations/patient.schema";

interface PatientFilter {
  clinicId: Types.ObjectId;
  status?: PatientStatus;
  $or?: Array<Record<string, unknown>>;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePhone(phone: string | undefined): string | null {
  const value = phone?.trim() ?? "";
  return value.length > 0 ? value : null;
}

export function defaultToothChart(): ToothEntry[] {
  return TOOTH_NUMBERS.map((tooth) => ({ tooth, condition: "healthy", restored: false, note: "" }));
}

export function normalizeToothChart(entries?: Array<{ tooth: number; condition: string; restored?: boolean; note?: string }>): ToothEntry[] {
  const source = entries && entries.length > 0 ? entries : defaultToothChart();
  const byTooth = new Map(source.map((entry) => [entry.tooth, entry]));
  return defaultToothChart().map((entry) => {
    const stored = byTooth.get(entry.tooth);
    return stored ? { ...entry, condition: stored.condition, restored: stored.restored ?? false, note: stored.note ?? "" } : entry;
  });
}

export function toSafePatient(doc: Record<string, unknown>): SafePatient {
  const insurance = (doc.insurance as Record<string, unknown>) ?? {};
  const emergency = (doc.emergencyContact as Record<string, unknown>) ?? {};
  return {
    id: String(doc._id),
    name: (doc.name as string) ?? "",
    dob: doc.dob ? (doc.dob as Date).toISOString() : null,
    gender: (doc.gender as string) ?? null,
    phone: (doc.phone as string) ?? "",
    email: (doc.email as string) ?? "",
    address: (doc.address as string) ?? "",
    city: (doc.city as string) ?? "",
    bloodGroup: (doc.bloodGroup as string) ?? "",
    status: (doc.status as string) ?? "active",
    tags: (doc.tags as string[]) ?? [],
    notes: (doc.notes as string) ?? "",
    avatar: (doc.avatar as string) ?? null,
    qrCode: (doc.qrCode as string) ?? null,
    familyHead: doc.familyHead ? String(doc.familyHead) : null,
    familyMembers: (doc.familyMembers as Types.ObjectId[])?.map((m) => String(m)) ?? [],
    insurance: {
      provider: (insurance.provider as string) ?? "",
      policyNumber: (insurance.policyNumber as string) ?? "",
      memberId: (insurance.memberId as string) ?? "",
    },
    emergencyContact: {
      name: (emergency.name as string) ?? "",
      relationship: (emergency.relationship as string) ?? "",
      phone: (emergency.phone as string) ?? "",
    },
    createdAt: doc.createdAt ? (doc.createdAt as Date).toISOString() : undefined,
    updatedAt: doc.updatedAt ? (doc.updatedAt as Date).toISOString() : undefined,
  };
}

export async function listPatients(
  context: TenantContext,
  opts: { page?: number; limit?: number; search?: string; status?: PatientStatus | "all" } = {}
): Promise<{ items: SafePatient[]; meta: PaginationMeta }> {
  await connectDB();
  requirePermission(context, "patients.view");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const page = Math.max(Number(opts.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(opts.limit ?? 20) || 20, 1), 50);

  const filter: PatientFilter = { clinicId: clinicObjectId };
  if (opts.status && opts.status !== "all") filter.status = opts.status;
  if (opts.search) {
    const search = escapeRegex(opts.search.trim());
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    PatientModel.countDocuments(filter),
    PatientModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    items: docs.map((doc) => toSafePatient(doc)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createPatient(context: TenantContext, input: CreatePatientInput): Promise<SafePatient> {
  await connectDB();
  requirePermission(context, "patients.create");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const phone = normalizePhone(input.phone);
  if (phone) {
    const existing = await PatientModel.findOne({ clinicId: clinicObjectId, phone }).select("_id").lean();
    if (existing) {
      throw ApiError.conflict("A patient with this phone number already exists");
    }
  }

  const doc = {
    clinicId: clinicObjectId,
    name: input.name,
    dob: input.dob ? new Date(input.dob) : null,
    gender: input.gender || null,
    phone,
    email: input.email ?? "",
    address: input.address ?? "",
    city: input.city ?? "",
    bloodGroup: input.bloodGroup ?? "",
    status: input.status ?? "active",
    tags: input.tags ?? [],
    notes: input.notes ?? "",
    avatar: input.avatar ?? null,
    familyHead: input.familyHead ? new Types.ObjectId(input.familyHead) : null,
    familyMembers: input.familyMembers?.map((id) => new Types.ObjectId(id)) ?? [],
    insurance: {
      provider: input.insurance?.provider ?? "",
      policyNumber: input.insurance?.policyNumber ?? "",
      memberId: input.insurance?.memberId ?? "",
    },
    emergencyContact: {
      name: input.emergencyContact?.name ?? "",
      relationship: input.emergencyContact?.relationship ?? "",
      phone: input.emergencyContact?.phone ?? "",
    },
    toothChart: defaultToothChart(),
    createdBy: new Types.ObjectId(context.userId),
  };

  try {
    const created = await PatientModel.create(doc);
    return toSafePatient(created.toObject());
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      throw ApiError.conflict("A patient with this phone number already exists");
    }
    throw error;
  }
}

export async function getPatientDetail(context: TenantContext, patientId: string): Promise<SafePatientDetail> {
  await connectDB();
  requirePermission(context, "patients.view");
  const clinicId = await requireClinic(context);

  const patient = await PatientModel.findOne({ _id: patientId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!patient) throw ApiError.notFound("Patient not found");

  const history = await MedicalHistoryModel.findOne({ patientId: patient._id, clinicId: patient.clinicId }).lean();

  return {
    ...toSafePatient(patient),
    toothChart: normalizeToothChart(patient.toothChart),
    history: history ? toSafeMedicalHistory(history) : null,
  };
}

export async function updatePatient(context: TenantContext, patientId: string, input: UpdatePatientInput): Promise<SafePatient> {
  await connectDB();
  requirePermission(context, "patients.update");
  const clinicId = await requireClinic(context);
  const clinicObjectId = new Types.ObjectId(clinicId);

  const target = await PatientModel.findOne({ _id: patientId, clinicId: clinicObjectId }).lean();
  if (!target) throw ApiError.notFound("Patient not found");

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.dob !== undefined) set.dob = input.dob ? new Date(input.dob) : null;
  if (input.gender !== undefined) set.gender = input.gender || null;
  if (input.phone !== undefined) set.phone = normalizePhone(input.phone);
  if (input.email !== undefined) set.email = input.email ?? "";
  if (input.address !== undefined) set.address = input.address ?? "";
  if (input.city !== undefined) set.city = input.city ?? "";
  if (input.bloodGroup !== undefined) set.bloodGroup = input.bloodGroup ?? "";
  if (input.status !== undefined) set.status = input.status;
  if (input.tags !== undefined) set.tags = input.tags ?? [];
  if (input.notes !== undefined) set.notes = input.notes ?? "";
  if (input.insurance !== undefined) {
    set.insurance = {
      provider: input.insurance.provider ?? "",
      policyNumber: input.insurance.policyNumber ?? "",
      memberId: input.insurance.memberId ?? "",
    };
  }
  if (input.emergencyContact !== undefined) {
    set.emergencyContact = {
      name: input.emergencyContact.name ?? "",
      relationship: input.emergencyContact.relationship ?? "",
      phone: input.emergencyContact.phone ?? "",
    };
  }
  if (input.avatar !== undefined) set.avatar = input.avatar ?? null;
  if (input.familyHead !== undefined) set.familyHead = input.familyHead ? new Types.ObjectId(input.familyHead) : null;
  if (input.familyMembers !== undefined) set.familyMembers = input.familyMembers?.map((id) => new Types.ObjectId(id)) ?? [];

  try {
    await PatientModel.updateOne({ _id: target._id }, { $set: set }).exec();
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      throw ApiError.conflict("A patient with this phone number already exists");
    }
    throw error;
  }

  const updated = await PatientModel.findById(target._id).lean();
  return toSafePatient(updated ?? target);
}

export async function deletePatient(context: TenantContext, patientId: string): Promise<void> {
  await connectDB();
  requirePermission(context, "patients.delete");
  const clinicId = await requireClinic(context);

  const target = await PatientModel.findOne({ _id: patientId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!target) throw ApiError.notFound("Patient not found");

  await Promise.all([
    PatientModel.deleteOne({ _id: target._id }).exec(),
    MedicalHistoryModel.deleteMany({ patientId: target._id }).exec(),
  ]);
}

export function toSafeMedicalHistory(doc: Record<string, unknown>): SafeMedicalHistory {
  return {
    patientId: String(doc.patientId),
    conditions: (doc.conditions as string[]) ?? [],
    allergies: (doc.allergies as string[]) ?? [],
    medications: (doc.medications as string[]) ?? [],
    smoking: (doc.smoking as string) ?? "never",
    alcohol: (doc.alcohol as string) ?? "never",
    drugUse: (doc.drugUse as string) ?? "never",
    pregnant: (doc.pregnant as boolean) ?? false,
    notes: (doc.notes as string) ?? "",
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null,
    updatedByName: null,
    updatedAt: doc.updatedAt ? (doc.updatedAt as Date).toISOString() : null,
  };
}
