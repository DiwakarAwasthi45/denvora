import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

export type InvoiceStatus = "draft" | "open" | "paid" | "partial" | "void";
export type InvoiceItemType = "service" | "membership" | "addon" | "discount";

const lineItemSchema = new Schema(
  {
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["service", "membership", "addon", "discount"],
      default: "service",
    },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", default: null, index: true },
    number: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "partial", "void"],
      default: "draft",
      index: true,
    },
    currency: { type: String, default: "NPR" },
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    issuedAt: { type: Date, default: () => new Date() },
    dueAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    voidedAt: { type: Date, default: null },
    items: { type: [lineItemSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

export type Invoice = InferSchemaType<typeof invoiceSchema> & {
  _id: Types.ObjectId;
  id?: string;
};

export const InvoiceModel: Model<Invoice> =
  models.Invoice ?? model("Invoice", invoiceSchema);
