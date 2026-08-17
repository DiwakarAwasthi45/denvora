import { model, models, Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const inventorySchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true, index: true },
    sku: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "pcs", trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, default: null },
    supplier: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

inventorySchema.index({ clinicId: 1, name: 1 });

export type InventoryItem = InferSchemaType<typeof inventorySchema> & {
  _id: Types.ObjectId;
};

export const InventoryModel: Model<InventoryItem> =
  models.Inventory ?? model("Inventory", inventorySchema);
