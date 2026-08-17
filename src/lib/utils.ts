import { createHash } from "node:crypto";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomHex(bytes = 16): string {
  return createHash("sha256").update(String(Math.random())).digest("hex").slice(0, bytes * 2);
}

export function generateOtp(length = 6): string {
  const digits = new Uint32Array(length);
  crypto.getRandomValues(digits);
  return Array.from(digits, (n) => String(n % 10)).join("");
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toObjectIdString(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

/** Alias used by notification/SMS masking. */
export const MASK_SMS = maskPhone;
