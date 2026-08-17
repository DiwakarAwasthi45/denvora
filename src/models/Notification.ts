import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type Channel = "email" | "sms" | "whatsapp";
export type Template =
  | "otp"
  | "password_reset"
  | "welcome"
  | "invite"
  | "appointment_reminder"
  | "payment_receipt";
export type Status = "queued" | "sent" | "failed";

const notificationSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    channel: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
    template: { type: String, required: true },
    recipient: { type: String, required: true },
    subject: { type: String },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued", index: true },
    sentAt: { type: Date, default: null },
    error: { type: String },
  },
  { timestamps: true }
);

export type Notification = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
};

export const NotificationModel: Model<Notification> =
  models.Notification ?? model("Notification", notificationSchema);
