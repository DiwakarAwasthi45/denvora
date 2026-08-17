import { route, apiSuccess } from "@/lib/api";
import { resetPasswordSchema } from "@/validations/auth.schema";
import { resetPassword } from "@/services/auth.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `reset-password:${ip}`,
    limit: RATE_LIMIT.otpMax,
    windowMs: RATE_LIMIT.otpWindowMs,
  });

  const body = await request.json();
  const input = resetPasswordSchema.parse(body);

  await resetPassword(input);

  return apiSuccess({ passwordReset: true });
});
