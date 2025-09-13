import Papa from "papaparse";
import fs from "fs/promises";
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


export const bulkCreateCustomers = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new AppError("No CSV provided", 400);

  const dryRun = req.query.dryRun === "1" || req.body?.dryRun === true;

  const csv = await fs.readFile(req.file.path, "utf8");
  // cleanup temp file
  await fs.unlink(req.file.path).catch(() => {});

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  const rows = (parsed.data || []).filter((r) =>
    Object.values(r).some((v) => (v ?? "") !== "")
  );

  const results = [];
  let received = rows.length;
  let accepted = 0;
  let inserted = 0;
  let duplicates = 0;
  let rejected = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowNo = i + 2; // header is row 1
    const key = raw.email || `row-${rowNo}`;

    try {
      const data = CustomerIn.parse(raw);

      // duplicate check
      const exists = await Customer.findOne({ email: data.email }).lean();
      if (exists) {
        duplicates++;
        accepted++; // it’s a valid row, but already exists
        results.push({
          row: rowNo,
          key,
          status: "duplicate",
          issues: [{ path: "email", message: "Email already exists" }],
        });
        continue;
      }

      if (!dryRun) {
        await Customer.create(data);
        inserted++;
      }
      accepted++;
      results.push({ row: rowNo, key, status: "ok" });
    } catch (err) {
      rejected++;
      const message =
        err?.issues?.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") ||
        err?.message ||
        "Validation failed";
      // Shape as `issues[]` for the UI
      results.push({
        row: rowNo,
        key,
        status: "error",
        issues: [{ path: "row", message }],
      });
    }
  }

  // send everything the UI needs
  return res.json({
    ok: rejected === 0,
    dryRun,
    summary: { received, accepted, inserted, duplicates, rejected },
    rows: results, // include both ok & error/duplicate rows
  });
});