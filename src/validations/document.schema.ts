import { z } from "zod";

export const createXRaySchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  appointmentId: z.string().optional().nullable(),
  type: z.enum(["bitewing", "periapical", "panoramic", "cbct", "cephalometric", "other"]),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  thumbnailUrl: z.string().url("Thumbnail URL must be a valid URL").optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  aiTags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export type CreateXRayInput = z.infer<typeof createXRaySchema>;

export const createDocumentSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  appointmentId: z.string().optional().nullable(),
  type: z.enum(["xray", "report", "consent", "prescription", "invoice", "treatment_plan", "lab_order", "insurance", "photo", "other"]),
  title: z.string().trim().min(1).max(120),
  fileUrl: z.string().url("File URL must be a valid URL"),
  fileSize: z.number().int().min(0).optional(),
  mimeType: z.string().trim().optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;