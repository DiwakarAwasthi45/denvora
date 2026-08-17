import { route, apiSuccess, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";
import { ServiceModel } from "@/models/Service";

export const GET = route(async (_request: Request, context: { params: Promise<Record<string, string>> }) => {
  const { slug } = await context.params;
  await connectDB();
  const clinic = await ClinicModel.findOne({ slug, status: "active" }).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");
  const services = await ServiceModel.find({ clinicId: clinic._id, isActive: true })
    .select("name durationMinutes price")
    .sort({ name: 1 })
    .lean();
  return apiSuccess({
    services: services.map((s) => ({
      id: String(s._id),
      name: s.name,
      durationMinutes: s.durationMinutes ?? 30,
      price: s.price ?? 0,
    })),
  });
});
