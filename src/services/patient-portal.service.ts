import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { PatientModel } from "@/models/Patient";
import { AppointmentModel } from "@/models/Appointment";
import { InvoiceModel } from "@/models/Invoice";
import { DocumentModel } from "@/models/Document";
import { XRayModel } from "@/models/XRay";
import { ServiceModel } from "@/models/Service";
import { UserModel } from "@/models/User";
import { ChairModel } from "@/models/Chair";
import { TreatmentModel } from "@/models/Treatment";
import type { TenantContext, PaginationMeta, SafeAppointment } from "@/types";

async function getPatientByPhoneOrEmail(clinicId: Types.ObjectId, phone: string, email?: string) {
  const filter: Record<string, unknown> = { clinicId, phone };
  if (email) filter.$or = [{ phone }, { email }];
  const patient = await PatientModel.findOne(filter).lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  return patient;
}

function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

async function hydrateAppointment(doc: Record<string, unknown>): Promise<SafeAppointment> {
  const [service, dentist, chair] = await Promise.all([
    doc.serviceId ? ServiceModel.findById(doc.serviceId).select("name").lean() : null,
    doc.dentistId ? UserModel.findById(doc.dentistId).select("name").lean() : null,
    doc.chairId ? ChairModel.findById(doc.chairId).select("name").lean() : null,
  ]);

  return {
    id: String(doc._id),
    patientId: String(doc.patientId),
    patientName: "",
    patientPhone: "",
    dentistId: doc.dentistId ? String(doc.dentistId) : null,
    dentistName: dentist?.name ?? null,
    chairId: doc.chairId ? String(doc.chairId) : null,
    chairName: chair?.name ?? null,
    serviceId: doc.serviceId ? String(doc.serviceId) : null,
    date: doc.date as string,
    startTime: doc.startTime as string,
    endTime: doc.endTime as string,
    durationMinutes: durationMinutes(doc.startTime as string, doc.endTime as string),
    type: (doc.type as string) ?? "consultation",
    status: (doc.status as string) ?? "scheduled",
    reason: (doc.reason as string) ?? "",
    notes: (doc.notes as string) ?? "",
    checkedInAt: doc.checkedInAt ? (doc.checkedInAt as Date).toISOString() : null,
    cancelReason: (doc.cancelReason as string) ?? "",
    createdAt: doc.createdAt ? (doc.createdAt as Date).toISOString() : undefined,
    updatedAt: doc.updatedAt ? (doc.updatedAt as Date).toISOString() : undefined,
  };
}

export async function getPatientPortalData(
  phone: string,
  email: string | undefined,
  clinicSlug: string
): Promise<{
  patient: Record<string, unknown>;
  appointments: SafeAppointment[];
  invoices: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  xrays: Array<Record<string, unknown>>;
  treatments: Array<Record<string, unknown>>;
}> {
  await connectDB();

  const clinic = await (await import("@/models/Clinic")).ClinicModel.findOne({ slug: clinicSlug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");

  const patient = await getPatientByPhoneOrEmail(clinic._id, phone, email);

  const [appointments, invoices, documents, xrays, treatments] = await Promise.all([
    AppointmentModel.find({ clinicId: clinic._id, patientId: patient._id })
      .sort({ date: -1, startTime: -1 })
      .limit(50)
      .lean(),
    InvoiceModel.find({ clinicId: clinic._id, patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    DocumentModel.find({ clinicId: clinic._id, patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    XRayModel.find({ clinicId: clinic._id, patientId: patient._id })
      .sort({ capturedAt: -1 })
      .limit(20)
      .lean(),
    TreatmentModel.find({ clinicId: clinic._id, patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const hydratedAppointments = await Promise.all(appointments.map(hydrateAppointment));

  return {
    patient: {
      id: String(patient._id),
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      dob: patient.dob ? patient.dob.toISOString() : null,
      gender: patient.gender,
      avatar: patient.avatar,
      qrCode: patient.qrCode,
    },
    appointments: hydratedAppointments,
    invoices: invoices.map((inv) => ({
      id: String(inv._id),
      number: inv.number,
      status: inv.status,
      total: inv.total,
      currency: inv.currency,
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      paidAt: inv.paidAt,
    })),
    documents: documents.map((doc) => ({
      id: String(doc._id),
      type: doc.type,
      title: doc.title,
      fileUrl: doc.fileUrl,
      createdAt: doc.createdAt,
    })),
    xrays: xrays.map((x) => ({
      id: String(x._id),
      type: x.type,
      region: x.region,
      imageUrl: x.imageUrl,
      thumbnailUrl: x.thumbnailUrl,
      capturedAt: x.capturedAt,
    })),
    treatments: treatments.map((t) => ({
      id: String(t._id),
      diagnosis: t.diagnosis,
      procedure: t.procedure,
      status: t.status,
      cost: t.cost,
      priority: t.priority,
      notes: t.notes,
      createdAt: t.createdAt,
    })),
  };
}