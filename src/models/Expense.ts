import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const expenseSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
    category: { type: String, default: "General", trim: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NPR" },
    vendor: { type: String, default: "", trim: true },
    date: { type: Date, default: () => new Date() },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ clinicId: 1, date: -1 });

export type Expense = InferSchemaType<typeof expenseSchema> & {
  _id: Types.ObjectId;
};

export const ExpenseModel: Model<Expense> = models.Expense ?? model("Expense", expenseSchema);
