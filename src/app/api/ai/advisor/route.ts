import { route, apiSuccess } from "@/lib/api";
import { businessAdvisor } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const question = new URL(request.url).searchParams.get("q")?.trim() || undefined;
  const data = await businessAdvisor(context, question);
  return apiSuccess(data);
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = (await request.json().catch(() => ({}))) as { topic?: string };
  const data = await businessAdvisor(context, body.topic?.trim() || undefined);
  return apiSuccess(data);
});
