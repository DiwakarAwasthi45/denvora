import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ClinicModel } from "@/models/Clinic";
import { PatientModel } from "@/models/Patient";
import { AppointmentModel } from "@/models/Appointment";
import { ChairModel } from "@/models/Chair";
import { ServiceModel } from "@/models/Service";
import { UserModel } from "@/models/User";
import type { PublicBookingInput, PublicAvailableSlotsInput } from "@/validations/public-booking.schema";

interface TimeSlot {
  startTime: string;
  endTime: string;
  dentistId: string | null;
  dentistName: string | null;
  chairId: string;
  chairName: string;
}

async function findOrCreatePatient(clinicId: Types.ObjectId, input: PublicBookingInput["patient"]) {
  const phone = input.phone.trim();
  let patient = await PatientModel.findOne({ clinicId, phone }).lean();
  if (patient) return patient;

  patient = await PatientModel.create({
    clinicId,
    name: input.name,
    phone,
    email: input.email ?? "",
    dob: input.dob ? new Date(input.dob) : null,
    gender: input.gender ?? null,
    status: "active",
    createdBy: null,
  });
  return patient;
}

export async function getAvailableSlots(input: PublicAvailableSlotsInput): Promise<TimeSlot[]> {
  await connectDB();

  const clinic = await ClinicModel.findOne({ slug: input.clinicSlug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");

  const service = await ServiceModel.findOne({ _id: input.serviceId, clinicId: clinic._id, isActive: true }).lean();
  if (!service) throw ApiError.notFound("Service not found");

  const duration = service.durationMinutes ?? 30;
  const chairs = await ChairModel.find({ clinicId: clinic._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  if (chairs.length === 0) throw ApiError.badRequest("No chairs available");

  const dentists = await UserModel.find({
    clinicId: clinic._id,
    status: "active",
    role: { $in: ["dentist", "owner"] },
  }).select("_id name").lean();

  const booked = await AppointmentModel.find({
    clinicId: clinic._id,
    date: input.date,
    status: { $nin: ["cancelled", "no_show", "completed"] },
  })
    .select("chairId startTime endTime")
    .lean();

  const bookedByChair = new Map<string, Array<{ start: string; end: string }>>();
  for (const appt of booked) {
    const key = String(appt.chairId);
    if (!bookedByChair.has(key)) bookedByChair.set(key, []);
    bookedByChair.get(key)!.push({ start: appt.startTime, end: appt.endTime });
  }

  const slots: TimeSlot[] = [];
  const dayStart = 9 * 60; // 09:00
  const dayEnd = 18 * 60;  // 18:00

  for (const chair of chairs) {
    const chairBookings = bookedByChair.get(String(chair._id)) ?? [];
    const chairDentist = dentists.length > 0 ? dentists[0] : null; // round-robin or first available

    let current = dayStart;
    while (current + duration <= dayEnd) {
      const slotStart = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
      const slotEnd = `${String(Math.floor((current + duration) / 60)).padStart(2, "0")}:${String((current + duration) % 60).padStart(2, "0")}`;

      const overlaps = chairBookings.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );

      if (!overlaps) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          dentistId: chairDentist ? String(chairDentist._id) : null,
          dentistName: chairDentist ? chairDentist.name : null,
          chairId: String(chair._id),
          chairName: chair.name,
        });
      }
      current += duration;
    }
  }

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function createPublicBooking(input: PublicBookingInput): Promise<{ appointmentId: string }> {
  await connectDB();

  const clinic = await ClinicModel.findOne({ slug: input.clinicSlug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");

  const service = await ServiceModel.findOne({ _id: input.serviceId, clinicId: clinic._id, isActive: true }).lean();
  if (!service) throw ApiError.notFound("Service not found");

  const duration = service.durationMinutes ?? 30;

  const patient = await findOrCreatePatient(clinic._id, input.patient);

  const chairs = await ChairModel.find({ clinicId: clinic._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const dentists = await UserModel.find({
    clinicId: clinic._id,
    status: "active",
    role: { $in: ["dentist", "owner"] },
  }).select("_id name").lean();

  const booked = await AppointmentModel.find({
    clinicId: clinic._id,
    date: input.date,
    status: { $nin: ["cancelled", "no_show", "completed"] },
  }).select("chairId startTime endTime").lean();

  const bookedByChair = new Map<string, Array<{ start: string; end: string }>>();
  for (const appt of booked) {
    const key = String(appt.chairId);
    if (!bookedByChair.has(key)) bookedByChair.set(key, []);
    bookedByChair.get(key)!.push({ start: appt.startTime, end: appt.endTime });
  }

  function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
  }

  const endTime = addMinutes(input.startTime, duration);

  let assignedChair = chairs[0];
  const assignedDentist = dentists.length > 0 ? dentists[0] : null;

  for (const chair of chairs) {
    const chairBookings = bookedByChair.get(String(chair._id)) ?? [];
    const overlaps = chairBookings.some(
      (b) => input.startTime < b.end && endTime > b.start
    );
    if (!overlaps) {
      assignedChair = chair;
      break;
    }
  }

  const appointment = await AppointmentModel.create({
    clinicId: clinic._id,
    patientId: patient._id,
    dentistId: assignedDentist ? assignedDentist._id : null,
    chairId: assignedChair._id,
    serviceId: new Types.ObjectId(input.serviceId),
    date: input.date,
    startTime: input.startTime,
    endTime,
    type: "consultation",
    status: "scheduled",
    reason: input.notes ?? "",
    notes: "",
    createdBy: null,
  });

  return { appointmentId: String(appointment._id) };
}