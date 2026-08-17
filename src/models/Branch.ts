import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const branchSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export type Branch = InferSchemaType<typeof branchSchema> & {
  _id: Types.ObjectId;
};

export const BranchModel: Model<Branch> = models.Branch ?? model("Branch", branchSchema);
