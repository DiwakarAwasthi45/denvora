import { route, apiSuccess } from "@/lib/api";
import { getMedicalHistory, updateMedicalHistory } from "@/services/history.service";
import { getTenantContext } from "@/services/access.service";
import { medicalHistorySchema } from "@/validations/patient.schema";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const history = await getMedicalHistory(tenant, id);
  return apiSuccess(history);
});

export const PATCH = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const input = medicalHistorySchema.parse(body);
  const history = await updateMedicalHistory(tenant, id, input);
  return apiSuccess(history);
});
