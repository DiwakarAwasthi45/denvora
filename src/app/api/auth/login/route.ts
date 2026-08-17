import { route, apiSuccess, apiError, ERROR_CODES } from "@/lib/api";
import { loginSchema } from "@/validations/auth.schema";
import { verifyCredentials } from "@/services/auth.service";
import { signIn } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { RATE_LIMIT } from "@/constants/config";

export const POST = route(async (request: Request) => {
  const ip = getClientIp(request);
  assertRateLimit({
    key: `login:${ip}`,
    limit: RATE_LIMIT.authMax,
    windowMs: RATE_LIMIT.authWindowMs,
  });

  const body = await request.json();
  const input = loginSchema.parse(body);

  const user = await verifyCredentials(input);

  const resultUrl = await signIn("credentials", {
    redirect: false,
    email: input.email,
    password: input.password,
    callbackUrl: "/dashboard",
  });

  const error = new URL(resultUrl).searchParams.get("error");
  if (error) {
    return apiError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  return apiSuccess({ user });
});
