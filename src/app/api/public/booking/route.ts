import { route, apiSuccess } from "@/lib/api";
import { createPublicBooking } from "@/services/public-booking.service";
import { publicBookingSchema } from "@/validations/public-booking.schema";

export const POST = route(async (request: Request) => {
  const body = await request.json();
  const parsed = publicBookingSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors }), { status: 400 });
  }
  const result = await createPublicBooking(parsed.data);
  return apiSuccess(result, undefined, 201);
});