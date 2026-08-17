import { route, apiSuccess } from "@/lib/api";
import { z } from "zod";
import { requestPatientOtp } from "@/services/patient-auth.service";

const schema = z.object({ phone: z.string().trim().min(7), clinicSlug: z.string().trim().min(1) });

export const POST = route(async (request: Request) => {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  // Always return success-shaped response to avoid account enumeration.
  if (!parsed.success) return apiSuccess({ sent: false });
  const result = await requestPatientOtp(parsed.data.phone, parsed.data.clinicSlug);
  return apiSuccess({ sent: result.sent, code: result.code });
});
