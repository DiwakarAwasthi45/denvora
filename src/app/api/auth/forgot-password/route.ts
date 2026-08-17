import { route, apiSuccess } from "@/lib/api";
import { forgotPasswordSchema } from "@/validations/auth.schema";
import { forgotPassword } from "@/services/auth.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `forgot-password:${ip}`,
    limit: RATE_LIMIT.otpMax,
    windowMs: RATE_LIMIT.otpWindowMs,
  });

  const body = await request.json();
  const input = forgotPasswordSchema.parse(body);

  const result = await forgotPassword(input.email);

  // Always return success to avoid account enumeration.
  return apiSuccess({ maskedEmail: result.maskedEmail });
});
