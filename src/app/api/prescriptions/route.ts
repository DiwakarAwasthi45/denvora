import { route, apiSuccess } from "@/lib/api";
import { listPrescriptions, createPrescription } from "@/services/prescription.service";
import { getTenantContext } from "@/services/access.service";
import { createPrescriptionSchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const result = await listPrescriptions(context, { page, limit, patientId });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createPrescriptionSchema.parse(body);
  const prescription = await createPrescription(context, input);
  return apiSuccess(prescription, undefined, 201);
});
