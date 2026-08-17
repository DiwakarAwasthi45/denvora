import { route, apiSuccess } from "@/lib/api";
import { completeOnboarding } from "@/services/onboarding.service";
import { getTenantContext } from "@/services/access.service";
import { onboardingSchema } from "@/validations/onboarding.schema";

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = onboardingSchema.parse(body);
  const clinic = await completeOnboarding(context, input);
  return apiSuccess(clinic);
});
