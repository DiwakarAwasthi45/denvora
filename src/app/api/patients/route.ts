import { route, apiSuccess } from "@/lib/api";
import { createPatient, listPatients } from "@/services/patient.service";
import { getTenantContext } from "@/services/access.service";
import { createPatientSchema } from "@/validations/patient.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);

  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const search = url.searchParams.get("search")?.trim() || undefined;
  const rawStatus = url.searchParams.get("status")?.trim() || undefined;
  const status =
    rawStatus === "active" || rawStatus === "inactive" || rawStatus === "deceased" ? rawStatus : undefined;

  const result = await listPatients(context, { page, limit, search, status });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createPatientSchema.parse(body);
  const patient = await createPatient(context, input);
  return apiSuccess(patient, undefined, 201);
});
