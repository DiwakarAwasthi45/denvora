import { z } from "zod";

export const PASSWORD_RULES = {
  min: 8,
  requireUpper: true,
  requireNumber: true,
};

const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.min, `Password must be at least ${PASSWORD_RULES.min} characters`)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z.string().trim().regex(/^\+?[0-9\-\s]{7,20}$/, "Enter a valid phone number").optional().or(z.literal("")),
    clinicName: z.string().trim().min(2, "Clinic name must be at least 2 characters").max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  purpose: z.enum(["email_verification", "password_reset"]).default("email_verification"),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const acceptInviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
