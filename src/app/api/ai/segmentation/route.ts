import { route, apiSuccess } from "@/lib/api";
import { patientSegmentation } from "@/services/ai-features.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async () => {
  const context = await getTenantContext();
  const data = await patientSegmentation(context);
  return apiSuccess(data);
});
