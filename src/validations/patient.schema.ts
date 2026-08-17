import { z } from "zod";
import {
  BLOOD_GROUPS,
  GENDERS,
  PATIENT_STATUSES,
  TOOTH_CONDITIONS,
  HABIT_VALUES,
  EMERGENCY_RELATIONSHIPS,
} from "@/constants/patients";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\-\s]{7,20}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .optional();

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  dob: z.string().nullable().optional(),
  gender: z.enum(GENDERS).or(z.literal("")).nullable().optional(),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  bloodGroup: z.enum(BLOOD_GROUPS).optional().or(z.literal("")),
  status: z.enum(PATIENT_STATUSES).optional(),
  tags: tagsSchema,
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
  familyHead: z.string().optional().nullable(),
  familyMembers: z.array(z.string()).optional(),
  insurance: z
    .object({
      provider: z.string().trim().max(80).optional().or(z.literal("")),
      policyNumber: z.string().trim().max(80).optional().or(z.literal("")),
      memberId: z.string().trim().max(80).optional().or(z.literal("")),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().max(80).optional().or(z.literal("")),
      relationship: z.enum(EMERGENCY_RELATIONSHIPS).optional().or(z.literal("")),
      phone: phoneSchema,
    })
    .optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial().refine(
  (data) => {
    const { name, dob, gender, phone, email, address, city, bloodGroup, status, tags, notes, avatar, familyHead, familyMembers, insurance, emergencyContact } = data;
    return !(
      name === undefined &&
      dob === undefined &&
      gender === undefined &&
      phone === undefined &&
      email === undefined &&
      address === undefined &&
      city === undefined &&
      bloodGroup === undefined &&
      status === undefined &&
      tags === undefined &&
      notes === undefined &&
      avatar === undefined &&
      familyHead === undefined &&
      familyMembers === undefined &&
      insurance === undefined &&
      emergencyContact === undefined
    );
  },
  { message: "Nothing to update", path: ["_"] }
);

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const medicalHistorySchema = z.object({
  conditions: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  allergies: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  medications: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  smoking: z.enum(HABIT_VALUES).optional(),
  alcohol: z.enum(HABIT_VALUES).optional(),
  drugUse: z.enum(HABIT_VALUES).optional(),
  pregnant: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type MedicalHistoryInput = z.infer<typeof medicalHistorySchema>;

export const toothChartSchema = z.object({
  teeth: z
    .array(
      z.object({
        tooth: z.number().int().min(1).max(32),
        condition: z.enum(TOOTH_CONDITIONS),
        restored: z.boolean().optional(),
        note: z.string().trim().max(200).optional().or(z.literal("")),
      })
    )
    .min(1)
    .max(32)
    .refine(
      (teeth) => new Set(teeth.map((t) => t.tooth)).size === teeth.length,
      { message: "Each tooth can only appear once", path: ["teeth"] }
    ),
});

export type ToothChartInput = z.infer<typeof toothChartSchema>;
