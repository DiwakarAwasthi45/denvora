import { route, apiSuccess } from "@/lib/api";
import { listLabCases, createLabCase, updateLabCaseStatus } from "@/services/lab.service";
import { getTenantContext } from "@/services/access.service";
import { createLabCaseSchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const status = url.searchParams.get("status")?.trim() || undefined;
  const result = await listLabCases(context, { page, limit, status });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createLabCaseSchema.parse(body);
  const labCase = await createLabCase(context, input);
  return apiSuccess(labCase, undefined, 201);
});

export const PATCH = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const id = body.id;
  const status = body.status;
  if (!id || !status) return new Response(JSON.stringify({ success: false, message: "id and status required" }), { status: 400 });
  const labCase = await updateLabCaseStatus(context, id, status);
  return apiSuccess(labCase);
});
