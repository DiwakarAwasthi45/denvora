import { route, apiSuccess } from "@/lib/api";
import { BillingService } from "@/services/billing.service";
import { getTenantContext } from "@/services/access.service";
import { subscribeSchema } from "@/validations/billing.schema";
import { PRICING } from "@/constants/config";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const plans = PRICING.plans;
  return apiSuccess({ plans });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) throw parsed.error;
  await BillingService.subscribeToPlan(context, parsed.data.plan, parsed.data.billingCycle);
  return apiSuccess({ subscribed: true }, undefined, 200);
});
