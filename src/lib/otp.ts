import { sha256 } from "./utils";

export function hashToken(token: string): string {
  return sha256(token);
}

export function createOtpCode(): string {
  const digits = new Uint32Array(6);
  crypto.getRandomValues(digits);
  return Array.from(digits, (n) => String(n % 10)).join("");
}

/**
 * Timing-safe comparison to avoid leaking OTP values through timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
