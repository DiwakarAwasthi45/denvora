import { route, apiSuccess } from "@/lib/api";
import { getClinicRoles } from "@/services/clinic.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const roles = await getClinicRoles(context);
  return apiSuccess(roles);
});
