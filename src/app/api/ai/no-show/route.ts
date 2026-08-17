import { route, apiSuccess } from "@/lib/api";
import { noShowPrediction } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ success: false, message: "id required" }), { status: 400 });
  const data = await noShowPrediction(context, id);
  return apiSuccess(data);
});
