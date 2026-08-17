import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const leadSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    source: { type: String, enum: ["website", "whatsapp", "call", "walk_in", "referral", "social", "other"], default: "walk_in" },
    status: {
      type: String,
      enum: ["new", "contacted", "consultation", "treatment", "converted", "lost"],
      default: "new",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, default: "", trim: true },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leadSchema.index({ clinicId: 1, status: 1 });

export type Lead = InferSchemaType<typeof leadSchema> & {
  _id: Types.ObjectId;
};

export const LeadModel: Model<Lead> = models.Lead ?? model("Lead", leadSchema);
