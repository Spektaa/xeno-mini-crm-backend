// routes/customers.routes.js
import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { protect } from "../middleware/protect.js";          // export const protect = requireAuth();
import { validate } from "../middleware/validate.middleware.js";        // the safeParse middleware you shared
import { CustomerIn } from "../validators/customer.validator.js";

import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  bulkCreateCustomers
} from "../controllers/customer.controller.js";

const upload = multer({ dest: "uploads/" });

const router = Router();

/** Schemas for body validation */
const CreateCustomerSchema = CustomerIn;                // full required fields
const UpdateCustomerSchema = CustomerIn.partial();      // partial updates allowed

// Create
router.route("/").post( validate(CreateCustomerSchema), createCustomer); 

router.get("/", protect, listCustomers); 

// Read
router.get("/:id", protect, getCustomer);  

// Update (partial)
router.patch("/:id", protect, validate(UpdateCustomerSchema), updateCustomer);

// Delete
router.delete("/:id", protect, deleteCustomer);

router.post("/bulk", protect, upload.single("file"), bulkCreateCustomers);

export default router;
