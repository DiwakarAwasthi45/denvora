import { route, apiSuccess } from "@/lib/api";
import { getPatientPortalData } from "@/services/patient-portal.service";
import { getPatientSessionFromRequest } from "@/lib/patient-session";
import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";

export const GET = route(async (request: Request) => {
  const url = new URL(request.url);
  const session = getPatientSessionFromRequest(request);

  let phone = url.searchParams.get("phone") ?? "";
  let clinicSlug = url.searchParams.get("clinicSlug") ?? "";

  if (session) {
    phone = session.ph;
    const clinic = await ClinicModel.findById(session.cid).select("slug").lean();
    if (clinic) clinicSlug = clinic.slug;
  }

  if (!phone || !clinicSlug) {
    return new Response(JSON.stringify({ success: false, message: "Phone and clinicSlug are required" }), { status: 400 });
  }

  const data = await getPatientPortalData(phone, undefined, clinicSlug);
  return apiSuccess(data);
});