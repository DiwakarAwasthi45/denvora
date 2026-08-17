import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const serviceSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true, index: true },
    code: { type: String, default: "", trim: true },
    price: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 30, min: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

serviceSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export type Service = InferSchemaType<typeof serviceSchema> & {
  _id: Types.ObjectId;
};

export const ServiceModel: Model<Service> = models.Service ?? model("Service", serviceSchema);
