import mongoose , {Schema} from "mongoose";

const customerSchema = Schema({

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  totalSpend: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  visits: { type: Number, default: 0 }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);