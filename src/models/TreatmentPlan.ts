import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type TreatmentPlanStatus = "draft" | "presented" | "accepted" | "partially_accepted" | "declined" | "completed";

const planItemSchema = new Schema(
  {
    treatmentId: { type: Schema.Types.ObjectId, ref: "Treatment", default: null },
    tooth: { type: Number, min: 1, max: 32, default: null },
    surface: { type: String, default: "", trim: true },
    diagnosis: { type: String, required: true, trim: true },
    procedure: { type: String, required: true, trim: true },
    estimatedCost: { type: Number, required: true, min: 0 },
    estimatedVisits: { type: Number, default: 1, min: 1 },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: {
      type: String,
      enum: ["proposed", "accepted", "declined", "completed"],
      default: "proposed",
    },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const treatmentPlanSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "presented", "accepted", "partially_accepted", "declined", "completed"],
      default: "draft",
      index: true,
    },
    totalEstimatedCost: { type: Number, default: 0, min: 0 },
    items: { type: [planItemSchema], default: [] },
    notes: { type: String, default: "", trim: true },
    presentedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

treatmentPlanSchema.index({ clinicId: 1, patientId: 1, status: 1 });

export type TreatmentPlan = InferSchemaType<typeof treatmentPlanSchema> & {
  _id: Types.ObjectId;
};

export const TreatmentPlanModel: Model<TreatmentPlan> = models.TreatmentPlan ?? model("TreatmentPlan", treatmentPlanSchema);