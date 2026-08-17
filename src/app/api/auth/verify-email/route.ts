import { route, apiSuccess } from "@/lib/api";
import { verifyEmailSchema } from "@/validations/auth.schema";
import { verifyEmail } from "@/services/auth.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `verify-email:${ip}`,
    limit: RATE_LIMIT.otpMax,
    windowMs: RATE_LIMIT.otpWindowMs,
  });

  const body = await request.json();
  const input = verifyEmailSchema.parse(body);

  const { user } = await verifyEmail(input);

  return apiSuccess({ user });
});
