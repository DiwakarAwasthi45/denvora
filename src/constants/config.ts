export const APP_NAME = process.env.APP_NAME ?? "Denvora";
export const APP_TRIAL_DAYS = Number(process.env.APP_TRIAL_DAYS ?? 14);

export const OTP = {
  length: 6,
  ttlMinutes: 10,
  maxAttempts: 5,
  cooldownSeconds: 60,
} as const;

export const RATE_LIMIT = {
  authWindowMs: 15 * 60 * 1000,
  authMax: 20,
  otpWindowMs: 60 * 1000,
  otpMax: 3,
} as const;

export const LOGIN = {
  /** Failed attempts before the account is temporarily locked. */
  maxAttempts: 5,
  /** Lock duration after exceeding maxAttempts. */
  lockMs: 15 * 60 * 1000,
} as const;

export const SESSION = {
  /** Absolute lifetime of an auth token (days). Tune via SESSION_MAX_DAYS env. */
  maxAgeDays: Number(process.env.SESSION_MAX_DAYS ?? 1),
} as const;

export const DEFAULT_CURRENCY = "NPR";
export const DEFAULT_TIMEZONE = "Asia/Kathmandu";
export const DEFAULT_COUNTRY = "NP";

export interface PricingPlan {
  name: string;
  tagline: string;
  monthlyPrice: number;
  popular?: boolean;
  features: string[];
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    tagline: "For solo dentists getting started",
    monthlyPrice: 1499,
    features: [
      "Up to 3 staff accounts",
      "500 active patients",
      "Appointments & queue",
      "Patient records & dental chart",
    ],
  },
  {
    name: "Growth",
    tagline: "For growing clinics",
    monthlyPrice: 3499,
    popular: true,
    features: [
      "Up to 10 staff accounts",
      "Unlimited patients",
      "Billing, payments & inventory",
      "Reports & data export",
    ],
  },
  {
    name: "Clinic",
    tagline: "For multi-branch practices",
    monthlyPrice: 6999,
    features: [
      "Unlimited staff accounts",
      "Multi-branch management",
      "Lab & prescriptions module",
      "Priority support",
    ],
  },
];

export const PRICING = {
  currency: DEFAULT_CURRENCY,
  plans: pricingPlans,
} as const;
