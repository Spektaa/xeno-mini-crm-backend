import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { NLParseIn } from "../validators/campaign.validator.js";
import { parseNLToRules } from "../controllers/nl2rules.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();
router.post("/segment-rules/parse", protect, validate(NLParseIn), parseNLToRules);
export default router;
