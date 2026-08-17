import { route, apiSuccess } from "@/lib/api";
import { getTreatmentAcceptanceFunnel } from "@/services/treatment.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const funnel = await getTreatmentAcceptanceFunnel(context, patientId);
  return apiSuccess({ funnel });
});