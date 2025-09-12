// routes/campaign.routes.js
import { Router } from "express";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  setCampaignStatus,
  previewAudience,
} from "../controllers/campaigns.controller.js";

import { protect } from "../middleware/protect.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  CampaignCreateIn,
  CampaignUpdateIn,
  CampaignStatusIn,
  SegmentRulesIn,
} from "../validators/campaign.validator.js";


const router = Router();

const sanitizeCreatedBy = (req, _res, next) => {
  if (typeof req.body?.createdBy !== "string") {
    delete req.body.createdBy; // prevent objects sneaking in from client
  }
  next();
};

/**
 * Copy createdBy from auth if client omits it.
 * Keep AFTER `protect` so req.auth is available.
 */
const attachCreator = (req, _res, next) => {
  if (!req.body?.createdBy && req.auth?.userId) {
    req.body.createdBy = req.auth.userId;
  }
  next();
};

// Schemas for this router
const CreateCampaignSchema = CampaignCreateIn;
const UpdateCampaignSchema = CampaignUpdateIn;
const StatusChangeSchema = CampaignStatusIn;

// Create (auth → attachCreator → validate → controller)
router.post(
  "/",
  protect,
  sanitizeCreatedBy,        // <--- add this
  attachCreator,            // must come after protect
  validate(CampaignCreateIn),
  createCampaign
);

// List
router.get("/", protect, listCampaigns);

// Read
router.get("/:id", protect, getCampaign);

// Update
router.patch("/:id", protect, validate(UpdateCampaignSchema), updateCampaign);

// Change status
router.patch("/:id/status", protect, validate(StatusChangeSchema), setCampaignStatus);

// Delete
router.delete("/:id", protect, deleteCampaign);

// Audience preview
router.post("/preview", previewAudience);

export default router;
