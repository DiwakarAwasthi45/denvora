import { route, apiSuccess } from "@/lib/api";
import { createStaffUser, listClinicUsers } from "@/services/user.service";
import { getTenantContext } from "@/services/access.service";
import { createUserSchema } from "@/validations/user.schema";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);

  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const search = url.searchParams.get("search")?.trim() || undefined;
  const role = url.searchParams.get("role")?.trim() || undefined;

  const result = await listClinicUsers(context, { page, limit, search, role });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createUserSchema.parse(body);
  const result = await createStaffUser(context, input);
  return apiSuccess(result, undefined, 201);
});
