import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const recallSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    type: { type: String, enum: ["cleaning", "checkup", "rct", "implant", "orthodontic", "follow_up", "other"], default: "checkup" },
    reason: { type: String, default: "", trim: true },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["scheduled", "sent", "completed", "cancelled"], default: "scheduled", index: true },
    channel: { type: String, enum: ["sms", "whatsapp", "email", "call"], default: "sms" },
    sentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

recallSchema.index({ clinicId: 1, dueDate: 1, status: 1 });

export type Recall = InferSchemaType<typeof recallSchema> & {
  _id: Types.ObjectId;
};

export const RecallModel: Model<Recall> = models.Recall ?? model("Recall", recallSchema);
