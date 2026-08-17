import { route, apiSuccess } from "@/lib/api";
import { registerSchema } from "@/validations/auth.schema";
import { registerUser } from "@/services/auth.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `register:${ip}`,
    limit: RATE_LIMIT.authMax,
    windowMs: RATE_LIMIT.authWindowMs,
  });

  const body = await request.json();
  const input = registerSchema.parse(body);

  const result = await registerUser(input);

  return apiSuccess(result, undefined, 201);
});
