import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const roleSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", index: true, default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String, index: true }],
    /** Seeded platform/clinic system roles cannot be deleted. */
    isSystem: { type: Boolean, default: false },
    /** true = platform-level role (super admin only) */
    isPlatform: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

roleSchema.index({ clinicId: 1, slug: 1 }, { unique: true });
roleSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export type Role = InferSchemaType<typeof roleSchema> & {
  _id: Types.ObjectId;
};

export const RoleModel: Model<Role> = models.Role ?? model("Role", roleSchema);
