import { route, apiSuccess } from "@/lib/api";
import { deleteAppointment, getAppointment, updateAppointment } from "@/services/appointment.service";
import { getTenantContext } from "@/services/access.service";
import { updateAppointmentSchema } from "@/validations/appointment.schema";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const appointment = await getAppointment(tenant, id);
  return apiSuccess(appointment);
});

export const PATCH = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const input = updateAppointmentSchema.parse(body);
  const appointment = await updateAppointment(tenant, id, input);
  return apiSuccess(appointment);
});

export const DELETE = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  await deleteAppointment(tenant, id);
  return apiSuccess({ deleted: true });
});
