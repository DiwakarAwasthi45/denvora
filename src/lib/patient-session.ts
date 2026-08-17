import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-patient-secret";
const NAME = "patient_session";
export const PATIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface PatientSessionData {
  pid: string; // patient id
  cid: string; // clinic id
  ph: string; // phone
  exp: number; // expiry epoch ms
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function createPatientToken(data: Omit<PatientSessionData, "exp">): string {
  const payload: PatientSessionData = { ...data, exp: Date.now() + PATIENT_SESSION_MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyPatientToken(token?: string | null): PatientSessionData | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as PatientSessionData;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Read & verify the patient session from a request's Cookie header. */
export function getPatientSessionFromRequest(request: Request): PatientSessionData | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${NAME}=`)) {
      return verifyPatientToken(trimmed.slice(NAME.length + 1));
    }
  }
  return null;
}

function attributes(): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${PATIENT_SESSION_MAX_AGE}; ${secure}`;
}

export function patientCookie(token: string): string {
  return `${NAME}=${token}; ${attributes()}`;
}

export function clearPatientCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${secure}`;
}
