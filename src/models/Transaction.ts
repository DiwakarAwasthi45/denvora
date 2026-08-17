import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

const transactionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    gateway: { type: String, enum: ["esewa", "khalti", "fonepay", "mock"], required: true },
    gatewayTxId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NPR" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    method: { type: String, default: "card" },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export type Transaction = InferSchemaType<typeof transactionSchema> & {
  _id: Types.ObjectId;
};

export const TransactionModel: Model<Transaction> =
  models.Transaction ?? model("Transaction", transactionSchema);
