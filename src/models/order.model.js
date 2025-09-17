import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    // keep required, but make sure we set it before validation
    amount: {
      type: Number,
      required: true,
      default: function () {
        // defaults are applied before validation
        return (this.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
      },
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// helper
function computeAmountFrom(items = []) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

// 1) Ensure amount exists before validation (covers create/save flow)
orderSchema.pre("validate", function (next) {
  if (this.items && (!this.amount || this.isModified("items"))) {
    this.amount = computeAmountFrom(this.items);
  }
  next();
});

// 2) Recompute amount on findOneAndUpdate (covers findByIdAndUpdate, etc.)
orderSchema.pre("findOneAndUpdate", function (next) {
  const u = this.getUpdate() || {};
  const items =
    u.items ??
    (u.$set && u.$set.items) ??
    null;

  if (items) {
    const amt = computeAmountFrom(items);
    if (u.$set) u.$set.amount = amt;
    else u.amount = amt;
  }
  next();
});


export const Order = mongoose.model("Order", orderSchema);
