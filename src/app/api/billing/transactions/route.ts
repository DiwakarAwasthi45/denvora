import { route, apiSuccess } from "@/lib/api";
import { BillingService } from "@/services/billing.service";
import { getTenantContext } from "@/services/access.service";
import { subscribeSchema } from "@/validations/billing.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const result = await BillingService.listTransactions(context, {});
  return apiSuccess({ items: result.items, meta: result.meta });
});
