import { route, apiSuccess, apiError, ERROR_CODES } from "@/lib/api";
import { getPatientSessionFromRequest } from "@/lib/patient-session";
import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";
import { PatientModel } from "@/models/Patient";

export const GET = route(async (request: Request) => {
  const session = getPatientSessionFromRequest(request);
  if (!session) return apiError("Not authenticated", 401, ERROR_CODES.UNAUTHORIZED);

  await connectDB();
  const [clinic, patient] = await Promise.all([
    ClinicModel.findById(session.cid).select("slug name").lean(),
    PatientModel.findById(session.pid).select("name phone email").lean(),
  ]);

  return apiSuccess({
    patientId: session.pid,
    clinicId: session.cid,
    clinicSlug: clinic?.slug ?? "",
    clinicName: clinic?.name ?? "",
    phone: session.ph,
    patientName: patient?.name ?? "",
  });
});
