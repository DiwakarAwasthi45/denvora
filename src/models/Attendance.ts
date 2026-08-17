import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const attendanceSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: ["present", "absent", "late", "half_day", "leave"], default: "present" },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ clinicId: 1, userId: 1, date: 1 }, { unique: true });

export type Attendance = InferSchemaType<typeof attendanceSchema> & {
  _id: Types.ObjectId;
};

export const AttendanceModel: Model<Attendance> = models.Attendance ?? model("Attendance", attendanceSchema);

const leaveSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["sick", "casual", "annual", "emergency", "unpaid"], default: "casual" },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export type Leave = InferSchemaType<typeof leaveSchema> & {
  _id: Types.ObjectId;
};

export const LeaveModel: Model<Leave> = models.Leave ?? model("Leave", leaveSchema);

const commissionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    baseAmount: { type: Number, required: true, min: 0 },
    rate: { type: Number, default: 0 }, // percentage
    amount: { type: Number, required: true, min: 0 },
    period: { type: String, required: true }, // YYYY-MM
    paidAt: { type: Date, default: null },
    status: { type: String, enum: ["unpaid", "paid"], default: "unpaid", index: true },
  },
  { timestamps: true }
);

commissionSchema.index({ clinicId: 1, userId: 1, period: 1 });

export type Commission = InferSchemaType<typeof commissionSchema> & {
  _id: Types.ObjectId;
};

export const CommissionModel: Model<Commission> = models.Commission ?? model("Commission", commissionSchema);
