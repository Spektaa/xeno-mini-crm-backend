import { Router } from "express";
import {
  createOrder,
  bulkCreateOrders,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  listOrdersByCustomer,
  revenueSummary,
  topCustomers,
} from "../controllers/order.controller.js";

import { protect } from "../middleware/protect.js";

const router = Router();

// Core CRUD
router.post("/", protect, createOrder);
router.post("/bulk", protect, bulkCreateOrders);
router.get("/", protect, listOrders);
router.get("/:id", protect, getOrder);
router.patch("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);


// Convenience
router.get("/by-customer/:customerId", protect, listOrdersByCustomer);

//unsed(for later updates)
//Analytics
router.get("/analytics/revenue", protect, revenueSummary);
router.get("/analytics/top-customers", protect, topCustomers);

export default router;
