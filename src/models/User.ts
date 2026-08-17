import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const userSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", index: true, default: null },
    branchId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", index: true, default: null },
    /** Denormalized role slug for fast session resolution. */
    role: { type: String, default: null, index: true },
    /** Snapshot of role permissions. Refreshed when the role changes. */
    permissions: { type: [String], default: [] },
    isPlatform: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "invited", "active", "suspended"],
      default: "pending",
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
    passwordChangedAt: { type: Date, default: null },
    /** Incremented on password reset/change; sessions carrying an older value are invalidated. */
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ clinicId: 1, role: 1 });

export type User = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const UserModel: Model<User> = models.User ?? model("User", userSchema);
