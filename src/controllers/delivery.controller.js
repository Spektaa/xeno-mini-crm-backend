import axios from "axios";
import { Communication } from "../models/communication_log.model.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { DeliveryReceiptIn, VendorSendIn } from "../validators/communication.validator.js";


export const vendorSend = asyncHandler(async (req, res) => {
  const input = VendorSendIn.parse(req.body);

  // Simulate network latency (optional)
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  await sleep(Math.floor(Math.random() * 500) + 50);

  const isSuccess = Math.random() < 0.9;
  const status = isSuccess ? "SENT" : "FAILED";
  const vendorResponse = isSuccess ? "Delivered OK" : "Simulated vendor failure";

  await axios.post(`https://xeno-mini-crm-backend-4vjf.onrender.com/api/v1/delivery-receipt`, {
    campaignId: input.campaignId,
    customerId: input.customerId,
    status,
    vendorResponse
  }, {
    headers: { "Content-Type": "application/json" }
  });

  return res.json({ ok: true, status });
});

export const deliveryReceipt = asyncHandler(async (req, res) => {
  const input = DeliveryReceiptIn.parse(req.body);

  const doc = await Communication.findOneAndUpdate(
    { campaign: input.campaignId, customer: input.customerId },
    { status: input.status, vendorResponse: input.vendorResponse || "" },
    { new: true }
  );

  if (!doc) throw new AppError("Communication log not found", 404);

  return res.json({ ok: true, data: { id: doc._id, status: doc.status } });
});
