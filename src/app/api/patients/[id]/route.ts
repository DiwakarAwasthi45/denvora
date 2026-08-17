import { route, apiSuccess } from "@/lib/api";
import { deletePatient, getPatientDetail, updatePatient } from "@/services/patient.service";
import { getTenantContext } from "@/services/access.service";
import { updatePatientSchema } from "@/validations/patient.schema";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const patient = await getPatientDetail(tenant, id);
  return apiSuccess(patient);
});

export const PATCH = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const input = updatePatientSchema.parse(body);
  const patient = await updatePatient(tenant, id, input);
  return apiSuccess(patient);
});

export const DELETE = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  await deletePatient(tenant, id);
  return apiSuccess({ deleted: true });
});
