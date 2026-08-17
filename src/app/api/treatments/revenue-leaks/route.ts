import { route, apiSuccess } from "@/lib/api";
import { getRevenueLeaks } from "@/services/treatment.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const leaks = await getRevenueLeaks(context);
  return apiSuccess({ leaks });
});