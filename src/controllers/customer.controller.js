import { asyncHandler } from "../utils/asynchandler.js";
import { AppError } from "../utils/AppError.js";
import { Customer } from "../models/customer.model.js";
import { CustomerIn } from "../validators/customer.validator.js";
import { rulesToMongo } from "../utils/rulesToMongo.js";

// Create
export const createCustomer = asyncHandler(async (req, res) => {
  const data = CustomerIn.parse(req.body);
  const exists = await Customer.findOne({ email: data.email }).lean();
  if (exists) throw new AppError("Email already exists", 409);

  const doc = await Customer.create(data);
  res.status(201).json({ ok: true, data: doc });
});

// List (with search + pagination)
export const listCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q } = CustomerIn.partial().parse(req.query);
  const filter = {};

  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") }
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter)
  ]);

  res.json({
    ok: true,
    data: items,
    meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
  });
});

// Read
export const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Customer.findById(id).lean();
  if (!doc) throw new AppError("Customer not found", 404);
  res.json({ ok: true, message : "User fetched sucessfully",data: doc });
});

// Update (partial)
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = CustomerIn.partial().parse(req.body);

  if (data.email) {
    const exists = await Customer.findOne({ email: data.email, _id: { $ne: id } }).lean();
    if (exists) throw new AppError("Email already in use", 409);
  }

  const doc = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new AppError("Customer not found", 404);
  res.json({ ok: true, data: doc });
});

// Delete
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Customer.findByIdAndDelete(id);
  if (!doc) throw new AppError("Customer not found", 404);
  res.json({ ok: true, message: "Deleted" });
});


export const previewAudience = asyncHandler(async (req, res) => {
  const { segmentRules, limit = 20 } = req.body;
  const filter = rulesToMongo(segmentRules || {});
  const rows = await Customer.find(filter).limit(Math.min(limit, 100));
  return res.json({ ok: true, data: rows, count: rows.length });
});
