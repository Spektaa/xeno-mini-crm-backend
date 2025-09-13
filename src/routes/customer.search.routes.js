
import { Router } from "express";
import { Customer } from "../models/customer.model.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.get("/search", protect, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ ok: true, data: [] });

  // simple case-insensitive prefix/contains search on email + name
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const rows = await Customer.find(
    { $or: [{ email: rx }, { name: rx }] },
    { _id: 1, name: 1, email: 1 }
  )
    .limit(10)
    .lean();

  res.json({ ok: true, data: rows });
});

export default router;
