import { route, apiSuccess } from "@/lib/api";
import { listInventory, createInventoryItem, adjustInventory } from "@/services/inventory.service";
import { getTenantContext } from "@/services/access.service";
import { createInventorySchema, adjustInventorySchema } from "@/validations/clinic-modules.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const category = url.searchParams.get("category")?.trim() || undefined;
  const lowStock = url.searchParams.get("lowStock") === "true";
  const result = await listInventory(context, { page, limit, category, lowStock });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createInventorySchema.parse(body);
  const item = await createInventoryItem(context, input);
  return apiSuccess(item, undefined, 201);
});

export const PATCH = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const { id, delta } = { id: body.id, ...(adjustInventorySchema.parse(body)) };
  if (!id) return new Response(JSON.stringify({ success: false, message: "id required" }), { status: 400 });
  const item = await adjustInventory(context, id, delta);
  return apiSuccess(item);
});
