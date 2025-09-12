import { asyncHandler } from "../utils/asynchandler.js";
import { AppError } from "../utils/AppError.js";
import { Communication } from "../models/communication.model.js";
import { CommunicationIn } from "../validators/communication.validator.js";

// Create a log (e.g., after sending SMS/Email via vendor)
export const createCommunication = asyncHandler(async (req, res) => {
  const payload = CommunicationIn.parse(req.body);
  const doc = await Communication.create(payload);
  res.status(201).json({ ok: true, data: doc });
});

// List with filters: by campaign or customer, + pagination
export const listCommunications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, campaign, customer, status } =
    CommunicationIn.parse(req.query);

  const filter = {};
  if (campaign) filter.campaign = campaign;
  if (customer) filter.customer = customer;
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Communication.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("campaign", "name status")
      .populate("customer", "name email phone")
      .lean(),
    Communication.countDocuments(filter)
  ]);

  res.json({
    ok: true,
    data: items,
    meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
  });
});

// Read
export const getCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Communication.findById(id)
    .populate("campaign", "name status")
    .populate("customer", "name email phone")
    .lean();
  if (!doc) throw new AppError("Communication not found", 404);
  res.json({ ok: true, data: doc });
});

// Update (e.g., vendor callback updates status / response)
export const updateCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = CommunicationIn.partial().parse(req.body);

  const doc = await Communication.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new AppError("Communication not found", 404);
  res.json({ ok: true, data: doc });
});

// Delete (rare, but for cleanup)
export const deleteCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Communication.findByIdAndDelete(id);
  if (!doc) throw new AppError("Communication not found", 404);
  res.json({ ok: true, message: "Deleted" });
});
