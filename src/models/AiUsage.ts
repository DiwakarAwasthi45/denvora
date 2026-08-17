import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const aiUsageSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    day: { type: String, required: true, index: true },
    tokens: { type: Number, default: 0 },
    models: [{ type: String }],
  },
  { timestamps: true }
);

export type AiUsage = InferSchemaType<typeof aiUsageSchema> & {
  _id: Types.ObjectId;
};

export const AiUsageModel: Model<AiUsage> =
  models.AiUsage ?? model("AiUsage", aiUsageSchema);
