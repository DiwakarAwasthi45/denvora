import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\-\s]{7,20}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: phoneSchema,
  roleId: z.string().trim().min(1, "Select a role"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80).optional(),
    phone: phoneSchema,
    roleId: z.string().trim().min(1, "Select a role").optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
    path: ["_"],
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
