import { route, apiSuccess } from "@/lib/api";
import { listCommissions } from "@/services/staff.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim() || undefined;
  const period = url.searchParams.get("period")?.trim() || undefined;
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 50) || 50;
  const result = await listCommissions(context, { userId, period, page, limit });
  return apiSuccess({ items: result.items, meta: result.meta });
});
