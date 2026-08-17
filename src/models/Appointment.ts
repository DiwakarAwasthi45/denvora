import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const appointmentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    chairId: { type: Schema.Types.ObjectId, ref: "Chair", default: null },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", default: null },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD, avoids timezone drift
    startTime: { type: String, required: true }, // HH:mm (24h, zero-padded)
    endTime: { type: String, required: true },
    type: {
      type: String,
      enum: ["consultation", "checkup", "treatment", "follow_up", "hygiene", "emergency", "other"],
      default: "consultation",
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "checked_in", "in_progress", "completed", "no_show", "cancelled"],
      default: "scheduled",
      index: true,
    },
    reason: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    checkedInAt: { type: Date, default: null },
    cancelReason: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

appointmentSchema.index({ clinicId: 1, date: 1, status: 1 });
appointmentSchema.index({ clinicId: 1, date: 1, startTime: 1 });
appointmentSchema.index({ clinicId: 1, chairId: 1, date: 1 });

export type Appointment = InferSchemaType<typeof appointmentSchema> & {
  _id: Types.ObjectId;
};

export const AppointmentModel: Model<Appointment> =
  models.Appointment ?? model("Appointment", appointmentSchema);
