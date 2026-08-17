import { route, apiSuccess } from "@/lib/api";
import { createAppointment, listAppointments } from "@/services/appointment.service";
import { getTenantContext } from "@/services/access.service";
import { createAppointmentSchema } from "@/validations/appointment.schema";
import { APPOINTMENT_STATUSES } from "@/constants/appointments";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);

  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 20) || 20;
  const date = url.searchParams.get("date")?.trim() || undefined;
  const search = url.searchParams.get("search")?.trim() || undefined;
  const rawStatus = url.searchParams.get("status")?.trim() || undefined;
  const status =
    rawStatus && (APPOINTMENT_STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : undefined;

  const result = await listAppointments(context, { page, limit, date, status, search });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = createAppointmentSchema.parse(body);
  const appointment = await createAppointment(context, input);
  return apiSuccess(appointment, undefined, 201);
});
