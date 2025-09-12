import { Router } from "express";
import { vendorSend, deliveryReceipt } from "../controllers/delivery.controller.js";
import { protect } from "../middleware/protect.js";
import { validate } from "../middleware/validate.middleware.js";
import { DeliveryReceiptIn, VendorSendIn } from "../validators/communication.validator.js";

const router = Router();

/**
 * Simulated Vendor endpoint — normally external.
 * Keep it unprotected to mimic a 3rd-party vendor (or protect if you prefer).
 */
router.post("/vendor/send", validate(VendorSendIn), vendorSend);

/**
 * Delivery receipt — called by the vendor (simulated above).
 * Keep unprotected (real vendors won’t have your auth), but you can add a shared secret.
 */
router.post("/delivery-receipt", validate(DeliveryReceiptIn), deliveryReceipt);

/**
 * Example: expose a protected list view to see logs per campaign (optional)
 */
import { Communication } from "../models/communication_log.model.js";
import { asyncHandler } from "../utils/asynchandler.js";

router.get(
  "/campaign/:id/logs",
  protect,
  asyncHandler(async (req, res) => {
    const logs = await Communication.find({ campaign: req.params.id })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });
    res.json({ ok: true, data: logs });
  })
);

export default router;
