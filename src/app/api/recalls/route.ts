import { route, apiSuccess } from "@/lib/api";
import { listRecalls, createRecall, sendRecall } from "@/services/recall.service";
import { getTenantContext } from "@/services/access.service";
import { createRecallSchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const status = url.searchParams.get("status")?.trim() || undefined;
  const result = await listRecalls(context, { page, limit, status });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createRecallSchema.parse(body);
  const recall = await createRecall(context, input);
  return apiSuccess(recall, undefined, 201);
});

export const PUT = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const id = body.id;
  if (!id) return new Response(JSON.stringify({ success: false, message: "id required" }), { status: 400 });
  const recall = await sendRecall(context, id);
  return apiSuccess(recall);
});
