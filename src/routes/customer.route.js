// routes/customers.routes.js
import { Router } from "express";
import { z } from "zod";

import { protect } from "../middleware/protect.js";          // export const protect = requireAuth();
import { validate } from "../middleware/validate.middleware.js";        // the safeParse middleware you shared
import { CustomerIn } from "../validators/customer.validator.js";

import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  bumpCustomerStats,
} from "../controllers/customer.controller.js";

const router = Router();

/** Schemas for body validation */
const CreateCustomerSchema = CustomerIn;                // full required fields
const UpdateCustomerSchema = CustomerIn.partial();      // partial updates allowed
const BumpSchema = z.object({
  spendDelta: z.number().optional().default(0),
  visitDelta: z.number().int().optional().default(0),
});

// Create
router.route("/").post( validate(CreateCustomerSchema), createCustomer); 

router.get("/", protect, listCustomers); 

// Read
router.get("/:id", protect, getCustomer);  

// Update (partial)
router.patch("/:id", protect, validate(UpdateCustomerSchema), updateCustomer);

// Delete
router.delete("/:id", protect, deleteCustomer);

// // Utility: bump stats for a customer
// router.post("/:id/bump", protect, validate(BumpSchema), bumpCustomerStats);

export default router;
