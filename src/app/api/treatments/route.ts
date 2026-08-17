import { route, apiSuccess } from "@/lib/api";
import { listTreatments, createTreatment } from "@/services/treatment.service";
import { getTenantContext } from "@/services/access.service";
import { createTreatmentSchema } from "@/validations/treatment.schema";
import { TreatmentStatus } from "@/models/Treatment";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const statusParam = url.searchParams.get("status")?.trim();
  const status = statusParam ? statusParam as TreatmentStatus : undefined;
  const result = await listTreatments(context, { page, limit, patientId, status });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createTreatmentSchema.parse(body);
  const treatment = await createTreatment(context, input);
  return apiSuccess(treatment, undefined, 201);
});