import { route, apiSuccess } from "@/lib/api";
import { resendOtpSchema } from "@/validations/auth.schema";
import { resendOtp } from "@/services/auth.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `resend-otp:${ip}`,
    limit: RATE_LIMIT.otpMax,
    windowMs: RATE_LIMIT.otpWindowMs,
  });

  const body = await request.json();
  const input = resendOtpSchema.parse(body);

  const result = await resendOtp(input);

  return apiSuccess({ maskedEmail: result.maskedEmail });
});
