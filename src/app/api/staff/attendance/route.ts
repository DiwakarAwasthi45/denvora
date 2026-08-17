import { route, apiSuccess } from "@/lib/api";
import { checkIn, checkOut, listAttendance } from "@/services/staff.service";
import { getTenantContext } from "@/services/access.service";

export const GET = route(async (request: Request) => {
  const context = await getTenantContext();
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim() || undefined;
  const month = url.searchParams.get("month")?.trim() || undefined;
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const limit = Number(url.searchParams.get("limit") ?? 50) || 50;
  const result = await listAttendance(context, { userId, month, page, limit });
  return apiSuccess({ items: result.items, meta: result.meta });
});

export const POST = route(async (request: Request) => {
  const context = await getTenantContext();
  const body = await request.json();
  const action = body.action ?? "in";
  const date = body.date ?? new Date().toISOString().slice(0, 10);
  const result = action === "out" ? await checkOut(context, date) : await checkIn(context, date);
  return apiSuccess(result);
});
