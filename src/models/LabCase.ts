import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const labCaseSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    labName: { type: String, default: "", trim: true },
    description: { type: String, required: true, trim: true },
    tooth: { type: Number, min: 1, max: 32, default: null },
    status: {
      type: String,
      enum: ["requested", "sent", "in_lab", "received", "delivered", "cancelled"],
      default: "requested",
      index: true,
    },
    dueDate: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cost: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

labCaseSchema.index({ clinicId: 1, status: 1 });

export type LabCase = InferSchemaType<typeof labCaseSchema> & {
  _id: Types.ObjectId;
};

export const LabCaseModel: Model<LabCase> = models.LabCase ?? model("LabCase", labCaseSchema);
