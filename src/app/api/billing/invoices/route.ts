import { route, apiSuccess } from "@/lib/api";
import { BillingService } from "@/services/billing.service";
import { getTenantContext } from "@/services/access.service";
import { createInvoiceSchema } from "@/validations/billing.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const status = url.searchParams.get("status")?.trim() || undefined;
  const result = await BillingService.listInvoices(context, { status, page, limit });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createInvoiceSchema.parse(body);
  const invoice = await BillingService.createInvoice(context, input);
  return apiSuccess(invoice, undefined, 201);
});
