import { route, apiSuccess } from "@/lib/api";
import { BillingService } from "@/services/billing.service";
import { getTenantContext } from "@/services/access.service";
import { createPaymentIntentSchema, verifyPaymentSchema } from "@/validations/billing.schema";

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const parsed = createPaymentIntentSchema.safeParse(body);
  if (!parsed.success) throw parsed.error;
  const result = await BillingService.createPaymentIntent(context, parsed.data.invoiceId);
  return apiSuccess(result, undefined, 201);
});

export const PUT = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) throw parsed.error;
  await BillingService.verifyPayment(context, parsed.data.intentId);
  return apiSuccess({ verified: true });
});
