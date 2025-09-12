// routes/communications.routes.js
import { Router } from "express";

import {
  createCommunication,
  listCommunications,
  getCommunication,
  updateCommunication,
  deleteCommunication,
  // optional webhook controller (included in my earlier controller rewrite)
  recordDeliveryReceipt,
} from "../controllers/communications.controller.js";

import { protect } from "../middleware/protect.js";
import { validate } from "../middleware/validate.middleware.js";
import { CommunicationIn } from "../validators/communication.validator.js";

const router = Router();

/** Schemas */
const CreateCommunicationSchema = CommunicationIn;
const UpdateCommunicationSchema = CommunicationIn.partial();

/** Core CRUD */
// Create a log entry (after sending via vendor)
router.post("/", protect, validate(CreateCommunicationSchema), createCommunication);

// List logs (?page=&limit=&campaign=&customer=&status=)
router.get("/", protect, listCommunications);

// Read one
router.get("/:id", protect, getCommunication);

// Update (partial)
router.patch("/:id", protect, validate(UpdateCommunicationSchema), updateCommunication);

// Delete
router.delete("/:id", protect, deleteCommunication);

/** Optional: Delivery receipt webhook
 * If your vendor simulator posts back delivery status, expose this.
 * Usually webhooks are NOT auth-protected; use a shared-secret header if needed.
 * The controller validates the body itself, so no validate() here is fine.
 */
router.post("/receipt", recordDeliveryReceipt);

export default router;
