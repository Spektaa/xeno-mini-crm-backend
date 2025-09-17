import { Router } from "express";
import { vendorSend, deliveryReceipt } from "../controllers/delivery.controller.js";
import { protect } from "../middleware/protect.js";
import { validate } from "../middleware/validate.middleware.js";
import { DeliveryReceiptIn, VendorSendIn } from "../validators/communication.validator.js";

const router = Router();


//Simulated Vendor endpoint
//vendorSend functionality would be added accordingy like (zhomail / engage lab)
//Keep it unprotected to mimic a 3rd-party vendor (or protect if you prefer).
router.post("/vendor/send", validate(VendorSendIn), vendorSend);

//Delivery receipt — called by the vendor (simulated above).
//Keep unprotected (real vendors won’t have your auth), but you can add a shared secret.
router.post("/delivery-receipt", validate(DeliveryReceiptIn), deliveryReceipt);

export default router;
