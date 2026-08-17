import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const insuranceSchema = new Schema(
  {
    provider: { type: String, default: "", trim: true },
    policyNumber: { type: String, default: "", trim: true },
    memberId: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const emergencyContactSchema = new Schema(
  {
    name: { type: String, default: "", trim: true },
    relationship: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const toothEntrySchema = new Schema(
  {
    tooth: { type: Number, required: true, min: 1, max: 32 },
    condition: { type: String, required: true, default: "healthy" },
    restored: { type: Boolean, default: false },
    note: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const patientSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other"], default: null },
    phone: { type: String, default: null, trim: true, index: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    bloodGroup: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "deceased"],
      default: "active",
      index: true,
    },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "", trim: true },
    insurance: { type: insuranceSchema, default: {} },
    emergencyContact: { type: emergencyContactSchema, default: {} },
    toothChart: { type: [toothEntrySchema], default: [] },
    avatar: { type: String, default: null },
    qrCode: { type: String, default: null },
    familyHead: { type: Schema.Types.ObjectId, ref: "Patient", default: null, index: true },
    familyMembers: [{ type: Schema.Types.ObjectId, ref: "Patient", default: [] }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

patientSchema.index({ clinicId: 1, status: 1 });
patientSchema.index({ clinicId: 1, name: 1 });
// Unique phone per clinic; documents with a null (empty) phone are excluded
// from the index so multiple patients without a phone do not collide.
patientSchema.index({ clinicId: 1, phone: 1 }, { sparse: true, unique: true });

export type Patient = InferSchemaType<typeof patientSchema> & {
  _id: Types.ObjectId;
};

export const PatientModel: Model<Patient> = models.Patient ?? model("Patient", patientSchema);
