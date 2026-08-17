import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type DocumentType =
  | "xray"
  | "report"
  | "consent"
  | "prescription"
  | "invoice"
  | "treatment_plan"
  | "lab_order"
  | "insurance"
  | "photo"
  | "other";

const documentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    type: { type: String, enum: ["xray", "report", "consent", "prescription", "invoice", "treatment_plan", "lab_order", "insurance", "photo", "other"], required: true },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/pdf" },
    description: { type: String, trim: true },
    tags: [{ type: String }],
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

documentSchema.index({ clinicId: 1, patientId: 1, createdAt: -1 });

export type Document = InferSchemaType<typeof documentSchema> & {
  _id: Types.ObjectId;
};

export const DocumentModel: Model<Document> = models.Document ?? model("Document", documentSchema);