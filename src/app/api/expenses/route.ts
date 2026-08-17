import { route, apiSuccess } from "@/lib/api";
import { listExpenses, createExpense, expensesSummary } from "@/services/expense.service";
import { getTenantContext } from "@/services/access.service";
import { createExpenseSchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const summary = url.searchParams.get("summary") === "true";
  const month = url.searchParams.get("month")?.trim() || undefined;
  const category = url.searchParams.get("category")?.trim() || undefined;
  if (summary) {
    const s = await expensesSummary(context, month);
    return apiSuccess(s);
  }
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const result = await listExpenses(context, { page, limit, category, month });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createExpenseSchema.parse(body);
  const expense = await createExpense(context, input);
  return apiSuccess(expense, undefined, 201);
});
