import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const workingHourSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    open: { type: String, default: "09:00" },
    close: { type: String, default: "17:00" },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
);

const clinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "NP" },
    timezone: { type: String, default: "Asia/Kathmandu" },
    logo: { type: String, default: "" },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    settings: {
      currency: { type: String, default: "NPR" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      vatEnabled: { type: Boolean, default: false },
      vatRate: { type: Number, default: 13, min: 0, max: 100 },
      workingHours: { type: [workingHourSchema], default: [] },
      language: { type: String, default: "en" },
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
      index: true,
    },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", default: null },
  },
  { timestamps: true }
);

export type Clinic = InferSchemaType<typeof clinicSchema> & {
  _id: Types.ObjectId;
};

export const ClinicModel: Model<Clinic> = models.Clinic ?? model("Clinic", clinicSchema);
