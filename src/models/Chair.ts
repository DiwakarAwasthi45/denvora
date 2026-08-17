import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const chairSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chairSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export type Chair = InferSchemaType<typeof chairSchema> & {
  _id: Types.ObjectId;
};

export const ChairModel: Model<Chair> = models.Chair ?? model("Chair", chairSchema);
