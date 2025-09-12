import mongoose, { Schema } from "mongoose";

const communicationSchema = new mongoose.Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    message: { type: String, required: true },
    vendorResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

communicationSchema.index({ campaign: 1, customer: 1 }, { unique: true });

export const Communication = mongoose.model(
  "Communication",
  communicationSchema
);
