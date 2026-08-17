import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export const TOKEN_TYPES = ["email_verification", "password_reset", "staff_invite", "patient_login"] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

const verificationTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    type: { type: String, enum: TOKEN_TYPES, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", index: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    /** For OTP-type tokens: number of failed verify attempts. */
    attempts: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

verificationTokenSchema.index({ tokenHash: 1 }, { unique: true });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VerificationToken = InferSchemaType<typeof verificationTokenSchema> & {
  _id: Types.ObjectId;
};

export const VerificationTokenModel: Model<VerificationToken> =
  models.VerificationToken ?? model("VerificationToken", verificationTokenSchema);
