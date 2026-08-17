import { route, apiSuccess } from "@/lib/api";
import { requestLeave } from "@/services/staff.service";
import { getTenantContext } from "@/services/access.service";
import { leaveSchema } from "@/validations/clinic-modules.schema";

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const input = leaveSchema.parse(body);
  const leave = await requestLeave(context, input);
  return apiSuccess(leave, undefined, 201);
});
