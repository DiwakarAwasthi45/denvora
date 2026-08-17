import { route, apiSuccess } from "@/lib/api";
import { acceptInvite } from "@/services/auth.service";
import { acceptInviteSchema } from "@/validations/auth.schema";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `accept-invite:${ip}`,
    limit: RATE_LIMIT.authMax,
    windowMs: RATE_LIMIT.authWindowMs,
  });

  const body = await request.json();
  const input = acceptInviteSchema.parse(body);
  const result = await acceptInvite(input);
  return apiSuccess(result);
});
