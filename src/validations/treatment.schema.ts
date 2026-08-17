import { z } from "zod";

const optionalId = z.string().trim().optional().or(z.literal(""));

export const createTreatmentSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  appointmentId: optionalId,
  dentistId: optionalId,
  tooth: z.number().int().min(1).max(32).optional().nullable(),
  surface: z.string().trim().max(20).optional().or(z.literal("")),
  diagnosis: z.string().trim().min(1).max(200),
  procedure: z.string().trim().min(1).max(200),
  status: z.enum(["proposed", "planned", "in_progress", "completed", "declined", "on_hold"]).optional(),
  cost: z.number().min(0).optional(),
  estimatedVisits: z.number().int().min(1).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;

export const updateTreatmentSchema = createTreatmentSchema.partial().extend({
  acceptedAt: z.string().datetime().optional().nullable(),
  declinedAt: z.string().datetime().optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, { message: "Nothing to update", path: ["_"] });

export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>;