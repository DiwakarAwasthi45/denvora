import { route, apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";

export const GET = route(async () => {
  await connectDB();
  const clinics = await ClinicModel.find({ status: "active" })
    .select("slug name city")
    .sort({ name: 1 })
    .lean();
  return apiSuccess({
    clinics: clinics.map((c) => ({ slug: c.slug, name: c.name, city: c.city ?? "" })),
  });
});
