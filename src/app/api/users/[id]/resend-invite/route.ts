import { route, apiSuccess } from "@/lib/api";
import { resendInvite } from "@/services/user.service";
import { getTenantContext } from "@/services/access.service";

export const POST = route(async (_request: Request, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const result = await resendInvite(tenant, id);
  return apiSuccess(result);
});
