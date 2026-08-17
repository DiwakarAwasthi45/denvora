import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type XRayType = "bitewing" | "periapical" | "panoramic" | "cbct" | "cephalometric" | "other";

const xraySchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    type: { type: String, enum: ["bitewing", "periapical", "panoramic", "cbct", "cephalometric", "other"], required: true },
    region: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    description: { type: String, trim: true },
    aiTags: [{ type: String }],
    capturedAt: { type: Date, default: () => new Date() },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

xraySchema.index({ clinicId: 1, patientId: 1, capturedAt: -1 });

export type XRay = InferSchemaType<typeof xraySchema> & {
  _id: Types.ObjectId;
};

export const XRayModel: Model<XRay> = models.XRay ?? model("XRay", xraySchema);