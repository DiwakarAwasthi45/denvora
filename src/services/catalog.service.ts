import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/models/Service";
import { DEFAULT_SERVICES } from "@/constants/services";
import { Types } from "mongoose";

export async function seedDefaultServices(clinicId: string): Promise<number> {
  await connectDB();
  const clinicObjectId = new Types.ObjectId(clinicId);

  const bulk = DEFAULT_SERVICES.map((service) => ({
    updateOne: {
      filter: { clinicId: clinicObjectId, name: service.name },
      update: { $setOnInsert: { ...service, clinicId: clinicObjectId } },
      upsert: true,
    },
  }));

  if (bulk.length) await ServiceModel.bulkWrite(bulk);
  return DEFAULT_SERVICES.length;
}

export async function countClinicServices(clinicId: string): Promise<number> {
  await connectDB();
  return ServiceModel.countDocuments({ clinicId: new Types.ObjectId(clinicId) });
}
