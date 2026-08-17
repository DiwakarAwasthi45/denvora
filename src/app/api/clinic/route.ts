import { route, apiSuccess } from "@/lib/api";
import { getCurrentClinic } from "@/services/clinic.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const clinic = await getCurrentClinic(context);
  return apiSuccess(clinic);
});
