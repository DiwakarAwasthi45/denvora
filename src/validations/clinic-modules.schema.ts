import { z } from "zod";

const optionalId = z.string().trim().optional().or(z.literal(""));

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  dentistId: optionalId,
  appointmentId: optionalId,
  items: z.array(z.object({
    medicine: z.string().trim().min(1),
    dosage: z.string().trim().max(40).optional().or(z.literal("")),
    frequency: z.string().trim().max(40).optional().or(z.literal("")),
    duration: z.string().trim().max(40).optional().or(z.literal("")),
    instructions: z.string().trim().max(200).optional().or(z.literal("")),
  })).min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["draft", "issued", "dispensed"]).optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const createInventorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  sku: z.string().trim().max(50).optional().or(z.literal("")),
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  unitCost: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  supplier: z.string().trim().max(100).optional().or(z.literal("")),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const adjustInventorySchema = z.object({ delta: z.number().int() });

export const createLabCaseSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  dentistId: optionalId,
  labName: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(300),
  tooth: z.number().int().min(1).max(32).optional().nullable(),
  status: z.enum(["requested", "sent", "in_lab", "received", "delivered", "cancelled"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  cost: z.number().min(0).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateLabCaseInput = z.infer<typeof createLabCaseSchema>;

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  source: z.enum(["website", "whatsapp", "call", "walk_in", "referral", "social", "other"]).optional(),
  status: z.enum(["new", "contacted", "consultation", "treatment", "converted", "lost"]).optional(),
  assignedTo: optionalId,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const createExpenseSchema = z.object({
  category: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(200),
  amount: z.number().min(0),
  vendor: z.string().trim().max(100).optional().or(z.literal("")),
  date: z.string().datetime().optional().nullable(),
  currency: z.string().length(3).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const createRecallSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  type: z.enum(["cleaning", "checkup", "rct", "implant", "orthodontic", "follow_up", "other"]).optional(),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
  dueDate: z.string().datetime(),
  channel: z.enum(["sms", "whatsapp", "email", "call"]).optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateRecallInput = z.infer<typeof createRecallSchema>;

export const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const leaveSchema = z.object({
  type: z.enum(["sick", "casual", "annual", "emergency", "unpaid"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});
