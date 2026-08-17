import { route, apiSuccess } from "@/lib/api";
import { getAiTreatmentSummary } from "@/services/treatment.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim();
  if (!patientId) return new Response(JSON.stringify({ success: false, message: "patientId is required" }), { status: 400 });
  const summary = await getAiTreatmentSummary(context, patientId);
  return apiSuccess({ summary });
});