import { route, apiSuccess } from "@/lib/api";
import { transitionStatus } from "@/services/queue.service";
import { getTenantContext } from "@/services/access.service";

type RouteContext = { params: Promise<Record<string, string>> };

export const POST = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const { status, chairId, cancelReason } = body as {
    status: string;
    chairId?: string;
    cancelReason?: string;
  };
  const appointment = await transitionStatus(tenant, id, status, { chairId, cancelReason });
  return apiSuccess(appointment);
});
