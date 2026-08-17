import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const medicalHistorySchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    conditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    smoking: { type: String, enum: ["never", "occasionally", "daily"], default: "never" },
    alcohol: { type: String, enum: ["never", "occasionally", "daily"], default: "never" },
    drugUse: { type: String, enum: ["never", "occasionally", "daily"], default: "never" },
    pregnant: { type: Boolean, default: false },
    notes: { type: String, default: "", trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

medicalHistorySchema.index({ clinicId: 1, patientId: 1 }, { unique: true });

export type MedicalHistory = InferSchemaType<typeof medicalHistorySchema> & {
  _id: Types.ObjectId;
};

export const MedicalHistoryModel: Model<MedicalHistory> =
  models.MedicalHistory ?? model("MedicalHistory", medicalHistorySchema);
