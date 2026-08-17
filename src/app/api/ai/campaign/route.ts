import { route, apiSuccess } from "@/lib/api";
import { campaignGenerator } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json().catch(() => ({}));
  const goal = typeof body.goal === "string" ? body.goal : "bring patients back for a checkup";
  const data = await campaignGenerator(context, goal);
  return apiSuccess(data);
});
