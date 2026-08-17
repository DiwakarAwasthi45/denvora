import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE, DEFAULT_COUNTRY } from "./config";

export const SUPPORTED_TIMEZONES = [
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Qatar",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Berlin",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
] as const;

export const SUPPORTED_CURRENCIES = ["NPR", "INR", "USD", "EUR", "GBP", "AUD", "SGD", "BDT", "PKR"] as const;

export const COUNTRY_PHONE_PREFIXES: Record<string, string> = {
  NP: "+977",
  IN: "+91",
  BD: "+880",
  PK: "+92",
  US: "+1",
  GB: "+44",
};

export const DEFAULT_LOCALE = {
  timezone: DEFAULT_TIMEZONE,
  currency: DEFAULT_CURRENCY,
  country: DEFAULT_COUNTRY,
} as const;
