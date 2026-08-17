import { route, apiSuccess } from "@/lib/api";
import { revenueAnalytics } from "@/services/analytics.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const month = new URL(request.url).searchParams.get("month")?.trim() || undefined;
  const data = await revenueAnalytics(context, month);
  return apiSuccess(data);
});
