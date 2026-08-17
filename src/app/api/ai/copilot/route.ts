import { route, apiSuccess } from "@/lib/api";
import { clinicCopilot } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const data = await clinicCopilot(context);
  return apiSuccess(data);
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = (await request.json().catch(() => ({}))) as { prompt?: string };
  const data = await clinicCopilot(context, body.prompt?.trim() || undefined);
  return apiSuccess({ reply: data.summary, insights: data.insights });
});
