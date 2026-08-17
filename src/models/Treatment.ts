import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type TreatmentStatus = "proposed" | "planned" | "in_progress" | "completed" | "declined" | "on_hold";

const treatmentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    dentistId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    tooth: { type: Number, min: 1, max: 32, default: null },
    surface: { type: String, default: "", trim: true },
    diagnosis: { type: String, required: true, trim: true },
    procedure: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["proposed", "planned", "in_progress", "completed", "declined", "on_hold"],
      default: "proposed",
      index: true,
    },
    cost: { type: Number, default: 0, min: 0 },
    estimatedVisits: { type: Number, default: 1, min: 1 },
    completedVisits: { type: Number, default: 0, min: 0 },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    notes: { type: String, default: "", trim: true },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

treatmentSchema.index({ clinicId: 1, patientId: 1, status: 1 });
treatmentSchema.index({ clinicId: 1, dentistId: 1, status: 1 });

export type Treatment = InferSchemaType<typeof treatmentSchema> & {
  _id: Types.ObjectId;
};

export const TreatmentModel: Model<Treatment> = models.Treatment ?? model("Treatment", treatmentSchema);