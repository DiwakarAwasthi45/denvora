import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const featureLimitsSchema = new Schema(
  {
    patients: { type: Number, default: 200 },
    users: { type: Number, default: 5 },
    branches: { type: Number, default: 1 },
    storageMb: { type: Number, default: 500 },
    aiCredits: { type: Number, default: 50 },
    appointmentsPerMonth: { type: Number, default: 500 },
  },
  { _id: false }
);

const subscriptionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    plan: {
      type: String,
      enum: ["trial", "starter", "professional", "enterprise"],
      default: "trial",
    },
    status: {
      type: String,
      enum: ["trial", "active", "past_due", "cancelled", "expired"],
      default: "trial",
      index: true,
    },
    billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "NPR" },
    trialEndsAt: { type: Date, default: null },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    limits: { type: featureLimitsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type Subscription = InferSchemaType<typeof subscriptionSchema> & {
  _id: Types.ObjectId;
};

export const SubscriptionModel: Model<Subscription> =
  models.Subscription ?? model("Subscription", subscriptionSchema);
