import { route, apiSuccess } from "@/lib/api";
import { revenueForecast } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const months = Number(new URL(request.url).searchParams.get("months") ?? 3) || 3;
  const data = await revenueForecast(context, months);
  return apiSuccess(data);
});
