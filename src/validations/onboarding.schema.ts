import { z } from "zod";
import { SUPPORTED_TIMEZONES, SUPPORTED_CURRENCIES } from "@/constants/locale";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time (HH:mm)");

const workingHourSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    open: timeSchema,
    close: timeSchema,
    isOpen: z.boolean(),
  })
  .refine((day) => !day.isOpen || day.close > day.open, {
    message: "Closing time must be after opening time",
    path: ["close"],
  });

const chairSchema = z.object({
  name: z.string().trim().min(1, "Chair name is required").max(60),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Clinic name must be at least 2 characters").max(120),
    phone: z.string().trim().regex(/^\+?[0-9\-\s]{7,20}$/, "Enter a valid phone number").optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    timezone: z.enum(SUPPORTED_TIMEZONES as unknown as [string, ...string[]]),
    currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]]),
    vatEnabled: z.boolean(),
    vatRate: z.number().min(0).max(100),
    workingHours: z.array(workingHourSchema).length(7, "Provide a full weekly schedule"),
    chairs: z.array(chairSchema).min(1, "Add at least one dental chair").max(30),
  })
  .refine((data) => new Set(data.workingHours.map((h) => h.day)).size === 7, {
    message: "Weekly schedule must cover each day exactly once",
    path: ["workingHours"],
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
