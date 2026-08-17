import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { PatientModel } from "@/models/Patient";
import { MedicalHistoryModel } from "@/models/MedicalHistory";
import { UserModel } from "@/models/User";
import { requireClinic, requirePermission } from "./access.service";
import { normalizeToothChart, toSafeMedicalHistory } from "./patient.service";
import type { TenantContext, SafeMedicalHistory, ToothEntry } from "@/types";
import type { MedicalHistoryInput, ToothChartInput } from "@/validations/patient.schema";

async function getScopedPatient(clinicId: string, patientId: string) {
  const patient = await PatientModel.findOne({ _id: patientId, clinicId: new Types.ObjectId(clinicId) }).lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

async function withUpdaterName(history: SafeMedicalHistory): Promise<SafeMedicalHistory> {
  if (!history.updatedBy) return history;
  const updater = await UserModel.findById(history.updatedBy).select("name").lean();
  return { ...history, updatedByName: updater?.name ?? null };
}

export async function getMedicalHistory(context: TenantContext, patientId: string): Promise<SafeMedicalHistory> {
  await connectDB();
  requirePermission(context, "history.view");
  const clinicId = await requireClinic(context);
  const patient = await getScopedPatient(clinicId, patientId);

  const doc = await MedicalHistoryModel.findOne({ patientId: patient._id, clinicId: patient.clinicId }).lean();
  const history = doc ? toSafeMedicalHistory(doc) : emptyHistory(String(patient._id));
  return withUpdaterName(history);
}

export async function updateMedicalHistory(
  context: TenantContext,
  patientId: string,
  input: MedicalHistoryInput
): Promise<SafeMedicalHistory> {
  await connectDB();
  requirePermission(context, "history.update");
  const clinicId = await requireClinic(context);
  const patient = await getScopedPatient(clinicId, patientId);

  const update: Record<string, unknown> = { updatedBy: new Types.ObjectId(context.userId) };
  if (input.conditions !== undefined) update.conditions = input.conditions;
  if (input.allergies !== undefined) update.allergies = input.allergies;
  if (input.medications !== undefined) update.medications = input.medications;
  if (input.smoking !== undefined) update.smoking = input.smoking;
  if (input.alcohol !== undefined) update.alcohol = input.alcohol;
  if (input.drugUse !== undefined) update.drugUse = input.drugUse;
  if (input.pregnant !== undefined) update.pregnant = input.pregnant;
  if (input.notes !== undefined) update.notes = input.notes ?? "";

  const doc = await MedicalHistoryModel.findOneAndUpdate(
    { patientId: patient._id, clinicId: patient.clinicId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return withUpdaterName(toSafeMedicalHistory(doc));
}

export async function getToothChart(context: TenantContext, patientId: string): Promise<ToothEntry[]> {
  await connectDB();
  requirePermission(context, "teeth.view");
  const clinicId = await requireClinic(context);
  const patient = await getScopedPatient(clinicId, patientId);
  return normalizeToothChart(patient.toothChart);
}

export async function updateToothChart(
  context: TenantContext,
  patientId: string,
  input: ToothChartInput
): Promise<ToothEntry[]> {
  await connectDB();
  requirePermission(context, "teeth.update");
  const clinicId = await requireClinic(context);
  const patient = await getScopedPatient(clinicId, patientId);

  const existing = normalizeToothChart(patient.toothChart);
  const merged = normalizeToothChart([...existing, ...input.teeth]);
  await PatientModel.updateOne({ _id: patient._id }, { $set: { toothChart: merged } }).exec();
  return merged;
}

function emptyHistory(patientId: string): SafeMedicalHistory {
  return {
    patientId,
    conditions: [],
    allergies: [],
    medications: [],
    smoking: "never",
    alcohol: "never",
    drugUse: "never",
    pregnant: false,
    notes: "",
    updatedBy: null,
    updatedByName: null,
    updatedAt: null,
  };
}
