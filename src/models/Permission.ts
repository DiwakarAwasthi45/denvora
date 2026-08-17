import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const permissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    module: { type: String, required: true, index: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export type Permission = InferSchemaType<typeof permissionSchema>;

export const PermissionModel: Model<Permission> =
  models.Permission ?? model("Permission", permissionSchema);
