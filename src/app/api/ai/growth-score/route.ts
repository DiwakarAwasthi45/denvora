import { route, apiSuccess } from "@/lib/api";
import { clinicGrowthScore } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const data = await clinicGrowthScore(context);
  return apiSuccess(data);
});
