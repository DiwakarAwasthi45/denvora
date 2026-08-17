import { z } from "zod";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from "@/constants/appointments";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time (HH:mm)");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date");

const optionalId = z.string().trim().optional().or(z.literal(""));

export const createAppointmentSchema = z
  .object({
    patientId: z.string().trim().min(1, "Select a patient"),
    dentistId: optionalId,
    chairId: optionalId,
    serviceId: optionalId,
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    type: z.enum(APPOINTMENT_TYPES).default("consultation"),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    reason: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
  .object({
    patientId: z.string().trim().min(1, "Select a patient").optional(),
    dentistId: optionalId,
    chairId: optionalId,
    serviceId: optionalId,
    date: dateSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    type: z.enum(APPOINTMENT_TYPES).optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    reason: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    cancelReason: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
    path: ["_"],
  });

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
