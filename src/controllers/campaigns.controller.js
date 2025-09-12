// controllers/campaign.controller.js
import axios from "axios";
import { asyncHandler } from "../utils/asynchandler.js";
import { Communication } from "../models/communication_log.model.js";
import { AppError } from "../utils/AppError.js";
import { Campaign } from "../models/campaign.model.js";
import { Customer } from "../models/customer.model.js";
import {
  CampaignUpdateIn,
  CampaignStatusIn,
  CampaignListQ,
  SegmentRulesIn,
} from "../validators/campaign.validator.js";
import { sanitizeSegmentRules } from "../utils/sanitizeSegmentRules.js";

// Create
export const createCampaign = asyncHandler(async (req, res) => {
  // Assume req.body already validated by your Zod CampaignCreateIn:
  // { name, message, segmentRules, createdBy }
  const campaign = await Campaign.create({
    createdBy: req.body.createdBy,
    name: req.body.name,
    segmentRules: req.body.segmentRules,
    audienceSize: 0,
    message: req.body.message,
    status: "draft",
  });

  // Find audience based on req.body.segmentRules (you already built a rule-builder)
  const audience = await Customer.find(req.body.segmentRules).select("_id name email phone");
  const audienceSize = audience.length;

  // Insert PENDING logs
  if (audienceSize) {
    const docs = audience.map((c) => ({
      campaign: campaign._id,
      customer: c._id,
      message: `Hi ${c.name ?? "there"}, ${req.body.message}`,
      status: "PENDING",
    }));
    await Communication.insertMany(docs);
  }

  // Update campaign audience size
  campaign.audienceSize = audienceSize;
  await campaign.save();

  // Trigger vendor send (fire-and-forget; ignore errors so API stays snappy)
  const vendorUrl = `${process.env.API_BASE_URL}/api/v1/vendor/send`;
  audience.forEach((c) => {
    axios.post(vendorUrl, {
      campaignId: String(campaign._id),
      customerId: String(c._id),
      message: `Hi ${c.name ?? "there"}, ${req.body.message}`,
    }).catch(() => {});
  });

  res.status(201).json({
    ok: true,
    data: { id: campaign._id, audienceSize, status: campaign.status },
  });
});

// List (by creator with pagination)
export const listCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, status } = CampaignListQ.parse(req.query);
  const filter = {};
  if (status) filter.status = status;

  if (req.auth?.userId) filter.createdBy = req.auth.userId; // keep per-user
  // else: remove this line to list all campaigns (admin)

  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Campaign.countDocuments(filter),
  ]);

  res.json({
    ok: true,
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Read
export const getCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Campaign.findById(id).lean();
  if (!doc) throw new AppError("Campaign not found", 404);
  res.json({ ok: true, data: doc });
});

// Update (recalc audienceSize if segmentRules change)
export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = CampaignUpdateIn.parse(req.body);

  const updates = { ...data };
  if (data.segmentRules) {
    updates.segmentRules = sanitizeSegmentRules(data.segmentRules);
    updates.audienceSize = await Customer.countDocuments(updates.segmentRules);
  }

  const doc = await Campaign.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!doc) throw new AppError("Campaign not found", 404);
  res.json({ ok: true, data: doc });
});

// Status transitions: draft -> running -> completed
const ALLOWED_NEXT = {
  draft: new Set(["running"]),
  running: new Set(["completed"]),
  completed: new Set(),
};

export const setCampaignStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = CampaignStatusIn.parse(req.body);

  const current = await Campaign.findById(id);
  if (!current) throw new AppError("Campaign not found", 404);

  if (!ALLOWED_NEXT[current.status]?.has(status)) {
    throw new AppError(`Invalid transition ${current.status} → ${status}`, 400);
  }

  current.status = status;
  await current.save();
  res.json({ ok: true, data: current });
});

// Delete
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Campaign.findByIdAndDelete(id);
  if (!doc) throw new AppError("Campaign not found", 404);
  res.json({ ok: true, message: "Deleted" });
});

// Preview audience
export const previewAudience = asyncHandler(async (req, res) => {
  const { segmentRules = {}, limit = 20 } = req.body || {};
  // Validate segmentRules in addition to sanitizing
  if (segmentRules) SegmentRulesIn.parse(segmentRules);

  const filter = sanitizeSegmentRules(segmentRules);
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ lastActive: -1 }).limit(Math.min(limit, 100)).lean(),
    Customer.countDocuments(filter),
  ]);

  res.json({ ok: true, data: { customers: items, total } });
});
