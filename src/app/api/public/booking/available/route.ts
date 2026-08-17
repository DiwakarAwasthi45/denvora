import { route, apiSuccess } from "@/lib/api";
import { getAvailableSlots } from "@/services/public-booking.service";
import { publicAvailableSlotsSchema } from "@/validations/public-booking.schema";

export const GET = route(async (request: Request) => {
  const url = new URL(request.url);
  const clinicSlug = url.searchParams.get("clinicSlug") ?? "";
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const date = url.searchParams.get("date") ?? "";

  const parsed = publicAvailableSlotsSchema.safeParse({ clinicSlug, serviceId, date });
  if (!parsed.success) return new Response(JSON.stringify({ success: false, message: "Invalid parameters" }), { status: 400 });

  const slots = await getAvailableSlots(parsed.data);
  return apiSuccess({ slots });
});