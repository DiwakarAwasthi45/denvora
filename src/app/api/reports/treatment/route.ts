import { route, apiSuccess } from "@/lib/api";
import { treatmentAnalytics } from "@/services/analytics.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (_request: Request) => {
  const context = await getTenantContext();
  const data = await treatmentAnalytics(context);
  return apiSuccess(data);
});
