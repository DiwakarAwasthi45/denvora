import { route, apiSuccess } from "@/lib/api";
import { getToothChart, updateToothChart } from "@/services/history.service";
import { getTenantContext } from "@/services/access.service";
import { toothChartSchema } from "@/validations/patient.schema";

type RouteContext = { params: Promise<Record<string, string>> };

export const GET = route(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const chart = await getToothChart(tenant, id);
  return apiSuccess(chart);
});

export const PATCH = route(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const tenant = await getTenantContext();
  const body = await request.json();
  const input = toothChartSchema.parse(body);
  const chart = await updateToothChart(tenant, id, input);
  return apiSuccess(chart);
});
