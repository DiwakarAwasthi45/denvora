import { route, apiSuccess } from "@/lib/api";
import { inventoryPrediction } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const data = await inventoryPrediction(context);
  return apiSuccess(data);
});
