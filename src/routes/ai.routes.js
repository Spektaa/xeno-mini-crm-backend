import { Router } from "express";
import { suggestMessages } from "../services/ai.service.js";

const router = Router();

// POST /api/ai/message-ideas
// backend/src/routes/ai.routes.js
router.post("/message-ideas", async (req, res) => {
  try {
    const { objective, audience, brand, tone, channels } = req.body || {};
    if (!objective || typeof objective !== "string" || !objective.trim()) {
      return res.status(400).json({ error: "objective is required" });
    }
    const variants = await suggestMessages({ objective, audience, brand, tone, channels });
    res.json({ variants });
  } catch (err) {
    console.error("AI message-ideas error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to generate suggestions" });
  }
});


export default router;
