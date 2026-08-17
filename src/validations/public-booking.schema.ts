import { z } from "zod";

export const publicBookingSchema = z.object({
  clinicSlug: z.string().min(1),
  patient: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^\+?[0-9\-\s]{7,20}$/, "Enter a valid phone number"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").optional().or(z.literal("")),
    dob: z.string().nullable().optional(),
    gender: z.enum(["male", "female", "other"]).optional().nullable(),
  }),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

export const publicAvailableSlotsSchema = z.object({
  clinicSlug: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type PublicAvailableSlotsInput = z.infer<typeof publicAvailableSlotsSchema>;