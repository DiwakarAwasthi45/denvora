import { connectDB } from "@/lib/db";
import { ClinicModel } from "@/models/Clinic";
import { ChairModel } from "@/models/Chair";
import { ApiError } from "@/lib/api";
import { requireClinic, requirePermission } from "./access.service";
import { seedDefaultServices } from "./catalog.service";
import { toSafeClinic } from "./clinic.service";
import { Types } from "mongoose";
import type { TenantContext, SafeClinic } from "@/types";
import type { OnboardingInput } from "@/validations/onboarding.schema";

export async function completeOnboarding(context: TenantContext, input: OnboardingInput): Promise<SafeClinic> {
  await connectDB();
  requirePermission(context, "clinic.update");

  const clinicId = await requireClinic(context);
  const clinic = await ClinicModel.findById(clinicId).lean();
  if (!clinic) throw ApiError.notFound("Clinic not found");
  if (clinic.status === "suspended") throw ApiError.forbidden("Clinic is suspended");

  const isPending = clinic.status === "pending";

  await ClinicModel.updateOne(
    { _id: clinicId },
    {
      $set: {
        name: input.name,
        phone: input.phone ?? "",
        address: input.address ?? "",
        city: input.city ?? "",
        timezone: input.timezone,
        settings: {
          ...clinic.settings,
          currency: input.currency,
          vatEnabled: input.vatEnabled,
          vatRate: input.vatRate,
          workingHours: input.workingHours,
        },
        status: isPending ? "active" : clinic.status,
      },
    }
  ).exec();

  if (isPending) {
    const clinicObjectId = new Types.ObjectId(clinicId);

    await ChairModel.deleteMany({ clinicId: clinicObjectId }).exec();
    if (input.chairs.length > 0) {
      await ChairModel.insertMany(
        input.chairs.map((chair, index) => ({
          clinicId: clinicObjectId,
          name: chair.name,
          location: chair.location ?? "",
          sortOrder: index,
        }))
      );
    }

    await seedDefaultServices(clinicId);
  }

  const updated = await ClinicModel.findById(clinicId).lean();
  return toSafeClinic(updated ?? clinic);
}
