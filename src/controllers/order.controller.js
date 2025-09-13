import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { AppError } from "../utils/AppError.js";
import { Order } from "../models/order.model.js";
import { Customer } from "../models/customer.model.js";
import { OrderIn } from "../validators/order.validator.js";


/** --------------------------
 * Create Order
 * - Validate with Zod (no client amount)
 * - Save via .save() so pre('save') computes amount from items
 * - Update customer stats in txn using computed amount
 * -------------------------*/
export const createOrder = asyncHandler(async (req, res) => {
  const payload = OrderIn.parse(req.body); // no amount allowed

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const customer = await Customer.findById(payload.customer).session(session);
    if (!customer) throw new AppError("Customer not found", 404);

    // Ensure orderDate exists (validator already sets default, but be explicit)
    const orderDoc = new Order({
      ...payload,
      orderDate: payload.orderDate ? new Date(payload.orderDate) : new Date(),
    });

    // runs schema middleware -> amount auto-calculated
    await orderDoc.save({ session });

    // update customer using computed amount
    await Customer.findByIdAndUpdate(
      payload.customer,
      {
        $inc: { totalSpend: orderDoc.amount || 0, visits: 1 },
        $set: { lastActive: orderDoc.orderDate || new Date() },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    res.status(201).json({ ok: true, data: orderDoc.toObject() });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

/** --------------------------
 * Bulk Create Orders (ingestion)
 * - Validate each row
 * - Pre-compute amount per row (insertMany skips save middleware)
 * - Batch-update customers in txn
 * -------------------------*/
export const bulkCreateOrders = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  if (!rows.length) throw new AppError("Provide an array of orders", 400);

  // Validate first (fail-fast with index)
  const valid = rows.map((r, idx) => {
    try {
      return OrderIn.parse(r);
    } catch (err) {
      err.message = `Row ${idx + 1}: ${err.message}`;
      throw err;
    }
  });

  // Compute amount per row (server-trusted)
  const docsToInsert = valid.map((v) => {
    const computedAmount = v.items.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    return {
      customer: v.customer,
      items: v.items,
      amount: computedAmount,
      orderDate: v.orderDate ? new Date(v.orderDate) : new Date(),
    };
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inserted = await Order.insertMany(docsToInsert, { session });

    // Aggregate deltas per customer
    const deltas = new Map(); // customerId -> { amountSum, count, lastActiveMax }
    for (const d of inserted) {
      const key = String(d.customer);
      const ts = d.orderDate || new Date();
      const existing =
        deltas.get(key) || { amountSum: 0, count: 0, lastActiveMax: ts };
      existing.amountSum += d.amount || 0;
      existing.count += 1;
      if (ts > existing.lastActiveMax) existing.lastActiveMax = ts;
      deltas.set(key, existing);
    }

    for (const [customerId, { amountSum, count, lastActiveMax }] of deltas) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: { totalSpend: amountSum, visits: count },
          $set: { lastActive: lastActiveMax },
        },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json({ ok: true, count: inserted.length, data: inserted });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

/** --------------------------
 * List Orders (filters + pagination)
 * Query: page, limit, q, status, customer, from, to, minAmount, maxAmount
 * -------------------------*/
export const listOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    customer,
    from,
    to,
    minAmount,
    maxAmount,
    q,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (customer) filter.customer = customer;

  if (from || to) {
    filter.orderDate = {};
    if (from) filter.orderDate.$gte = new Date(from);
    if (to) filter.orderDate.$lte = new Date(to);
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  // search by populated customer's name/email
  if (q) {
    const customerIds = await Customer.find({
      $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }],
    })
      .select("_id")
      .lean();
    filter.customer = { $in: customerIds.map((c) => c._id) };
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ orderDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("customer", "name email phone")
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    ok: true,
    data: items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/** --------------------------
 * Read One
 * -------------------------*/
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Order.findById(id)
    .populate("customer", "name email phone")
    .lean();
  if (!doc) throw new AppError("Order not found", 404);
  res.json({ ok: true, data: doc });
});

/** --------------------------
 * Update Order
 * - Validate partial (no client amount)
 * - Use doc.save() so amount is recalculated from items
 * - Reconcile customer stats with delta
 * -------------------------*/
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = OrderIn.partial().parse(req.body); // still strict: no amount

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const before = await Order.findById(id).session(session);
    if (!before) throw new AppError("Order not found", 404);

    const customerBefore = String(before.customer);
    const amountBefore = before.amount || 0;

    // apply allowed changes
    if (data.items) before.items = data.items;
    if (data.customer) before.customer = data.customer;
    if (data.orderDate) before.orderDate = new Date(data.orderDate);

    // save to trigger middleware -> recompute amount
    const after = await before.save({ session });

    const customerAfter = String(after.customer);
    const amountAfter = after.amount || 0;

    // Reconcile customer stats
    if (customerBefore !== customerAfter) {
      if (amountBefore) {
        await Customer.findByIdAndUpdate(
          customerBefore,
          { $inc: { totalSpend: -amountBefore } },
          { session }
        );
      }
      await Customer.findByIdAndUpdate(
        customerAfter,
        {
          $inc: { totalSpend: amountAfter, visits: 1 }, // counts as a visit on new customer
          $set: { lastActive: after.orderDate || new Date() },
        },
        { session }
      );
    } else {
      const delta = amountAfter - amountBefore;
      if (delta !== 0) {
        await Customer.findByIdAndUpdate(
          customerAfter,
          {
            $inc: { totalSpend: delta },
            $set: { lastActive: after.orderDate || new Date() },
          },
          { session }
        );
      }
    }

    await session.commitTransaction();
    res.json({ ok: true, data: after.toObject() });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

/** --------------------------
 * Delete Order
 * - Remove doc
 * - Decrement customer spend accordingly
 * -------------------------*/
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const doc = await Order.findByIdAndDelete(id, { session });
    if (!doc) throw new AppError("Order not found", 404);

    if (doc.amount && doc.customer) {
      await Customer.findByIdAndUpdate(
        doc.customer,
        { $inc: { totalSpend: -Math.abs(doc.amount) } },
        { session }
      );
    }

    await session.commitTransaction();
    res.json({ ok: true, message: "Deleted" });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

/** --------------------------
 * Customer-specific orders
 * -------------------------*/
export const listOrdersByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const [items, total] = await Promise.all([
    Order.find({ customer: customerId })
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ customer: customerId }),
  ]);

  res.json({
    ok: true,
    data: items,
    meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

/** --------------------------
 * Revenue summary (dashboards)
 * Query: granularity=day|month, from, to
 * -------------------------*/
export const revenueSummary = asyncHandler(async (req, res) => {
  const { from, to, granularity = "day" } = req.query;
  const match = {};
  if (from || to) {
    match.orderDate = {};
    if (from) match.orderDate.$gte = new Date(from);
    if (to) match.orderDate.$lte = new Date(to);
  }

  const dateFormat =
    granularity === "month"
      ? { $dateToString: { format: "%Y-%m", date: "$orderDate" } }
      : { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } };

  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: dateFormat,
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ ok: true, data: rows });
});

/** --------------------------
 * Top customers by revenue
 * Query: limit, from, to
 * -------------------------*/
export const topCustomers = asyncHandler(async (req, res) => {
  const { limit = 10, from, to } = req.query;
  const match = {};
  if (from || to) {
    match.orderDate = {};
    if (from) match.orderDate.$gte = new Date(from);
    if (to) match.orderDate.$lte = new Date(to);
  }

  const rows = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$customer",
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    {
      $project: {
        _id: 0,
        customerId: "$customer._id",
        name: "$customer.name",
        email: "$customer.email",
        phone: "$customer.phone",
        revenue: 1,
        count: 1,
      },
    },
  ]);

  res.json({ ok: true, data: rows });
});
