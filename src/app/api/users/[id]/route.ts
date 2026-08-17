import { route, apiSuccess } from "@/lib/api";
import { deleteStaffUser, getClinicUser, updateStaffUser } from "@/services/user.service";
import { getTenantContext } from "@/services/access.service";
import { updateUserSchema } from "@/validations/user.schema";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const user = await getClinicUser(tenant, id);
  return apiSuccess(user);
});

export const PATCH = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const input = updateUserSchema.parse(body);
  const user = await updateStaffUser(tenant, id, input);
  return apiSuccess(user);
});

export const DELETE = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  await deleteStaffUser(tenant, id);
  return apiSuccess({ deleted: true });
});
