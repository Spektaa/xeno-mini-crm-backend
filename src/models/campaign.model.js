import mongoose , {Schema} from "mongoose"


const campaignSchema = new mongoose.Schema({
  createdBy: { type: String, required: true }, // Clerk userId or Google sub
  name: { type: String, required: true },
  segmentRules: { type: Object, required: true },
  audienceSize: { type: Number, default: 0 },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["draft", "running", "completed"], 
    default: "draft" 
  }
}, { timestamps: true });


export const Campaign = mongoose.model('Campaign', campaignSchema);