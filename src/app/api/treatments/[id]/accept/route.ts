import { route, apiSuccess } from "@/lib/api";
import { acceptTreatment, declineTreatment, completeTreatment } from "@/services/treatment.service";
import { getTenantContext } from "@/services/access.service";

type RouteContext = { params: Promise<Record<string, string>> };

export const POST = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const action = new URL(request.url).searchParams.get("action") ?? "accept";

  let result;
  if (action === "accept") result = await acceptTreatment(tenant, id);
  else if (action === "decline") result = await declineTreatment(tenant, id);
  else if (action === "complete") result = await completeTreatment(tenant, id);
  else return new Response(JSON.stringify({ success: false, message: "Invalid action" }), { status: 400 });

  return apiSuccess(result);
});