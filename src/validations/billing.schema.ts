import { z } from "zod";

export const createInvoiceSchema = z.object({
  patientId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        type: z.enum(["service", "membership", "addon", "discount"]).optional(),
        quantity: z.number().int().min(1).optional(),
        unitPrice: z.number().min(0),
      })
    )
    .min(1),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  currency: z.string().length(3).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const createPaymentIntentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice id is required"),
});

export const verifyPaymentSchema = z.object({
  intentId: z.string().min(1, "Intent id is required"),
});

export const subscribeSchema = z.object({
  plan: z.string().min(1),
  billingCycle: z.enum(["monthly", "annual"]),
});
