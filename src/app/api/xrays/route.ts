import { route, apiSuccess } from "@/lib/api";
import { listXRays, createXRay } from "@/services/xray.service";
import { getTenantContext } from "@/services/access.service";
import { createXRaySchema } from "@/validations/document.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const result = await listXRays(context, { page, limit, patientId });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createXRaySchema.parse(body);
  const xray = await createXRay(context, input);
  return apiSuccess(xray, undefined, 201);
});