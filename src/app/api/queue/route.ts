import { route, apiSuccess } from "@/lib/api";
import { getQueue } from "@/services/queue.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const date = url.searchParams.get("date")?.trim() || undefined;

  const queue = await getQueue(context, { date });
  return apiSuccess(queue);
});
