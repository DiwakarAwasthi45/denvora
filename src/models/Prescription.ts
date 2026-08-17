import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const prescriptionItemSchema = new Schema(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, default: "", trim: true },
    frequency: { type: String, default: "", trim: true },
    duration: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    items: { type: [prescriptionItemSchema], default: [] },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["draft", "issued", "dispensed"], default: "issued", index: true },
    issuedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type Prescription = InferSchemaType<typeof prescriptionSchema> & {
  _id: Types.ObjectId;
};

export const PrescriptionModel: Model<Prescription> =
  models.Prescription ?? model("Prescription", prescriptionSchema);
