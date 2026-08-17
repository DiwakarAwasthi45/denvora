import { route, apiSuccess } from "@/lib/api";
import { z } from "zod";
import { verifyPatientOtp } from "@/services/patient-auth.service";
import { patientCookie } from "@/lib/patient-session";

const schema = z.object({
  phone: z.string().trim().min(7),
  clinicSlug: z.string().trim().min(1),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const POST = route(async (request: Request) => {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, message: "Invalid input", code: "VALIDATION_ERROR" }), { status: 400 });
  }
  const { token } = await verifyPatientOtp(parsed.data.phone, parsed.data.clinicSlug, parsed.data.otp);
  const res = apiSuccess({ ok: true });
  res.headers.append("Set-Cookie", patientCookie(token));
  return res;
});
