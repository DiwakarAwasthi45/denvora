import { route, apiSuccess } from "@/lib/api";
import { smartRecall, recallPrediction } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const mode = new URL(request.url).searchParams.get("mode") ?? "smart";
  const data = mode === "overdue" ? await recallPrediction(context) : await smartRecall(context);
  return apiSuccess(data);
});
