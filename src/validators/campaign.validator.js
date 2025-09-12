// validators/campaign.validator.js
import { z } from "zod";

/** Keep these in one place so validator + sanitizer stay in sync */
export const ALLOWED_FIELDS = [
  "totalSpend",
  "visits",
  "lastActive",
  "email",
  "phone",
  "name",
];

export const ALLOWED_OPS = [
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$eq",
  "$ne",
  "$in",
  "$nin",
  "$regex",
];

// Basic primitives you'll accept inside ops or direct equality
const Primitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// {$in: [...]} / {$nin: [...]} must be arrays
const InArray = z.array(Primitive);

// Only the ops you allow; strict() rejects unknown keys
const OpObject = z.object({
  $gt:  Primitive.optional(),
  $gte: Primitive.optional(),
  $lt:  Primitive.optional(),
  $lte: Primitive.optional(),
  $eq:  Primitive.optional(),
  $ne:  Primitive.optional(),
  $in:  InArray.optional(),
  $nin: InArray.optional(),
  $regex: z.union([z.string(), z.any()]).optional(), // RegExp serialized as string in JSON
}).strict();

// Per-field condition can be:
//  - primitive equality (e.g. { visits: 3 })
//  - operator object (e.g. { visits: { $gte: 2, $lt: 10 } })
const FieldCondition = z.union([Primitive, OpObject]);

/**
 * segmentRules:
 *  record(string -> FieldCondition) and then refine:
 *  - keys must be in ALLOWED_FIELDS
 *  - op keys must be in ALLOWED_OPS
 *  - enforce $in/$nin arrays; $regex length guard
 */
export const SegmentRulesIn = z
  .record(z.string(), FieldCondition)
  .superRefine((rules, ctx) => {
    for (const [field, cond] of Object.entries(rules || {})) {
      if (!ALLOWED_FIELDS.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown field "${field}". Allowed: ${ALLOWED_FIELDS.join(", ")}`,
          path: [field],
        });
        continue;
      }
      if (cond && typeof cond === "object" && !Array.isArray(cond)) {
        for (const [op, val] of Object.entries(cond)) {
          if (!ALLOWED_OPS.includes(op)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unsupported operator "${op}" on "${field}". Allowed: ${ALLOWED_OPS.join(", ")}`,
              path: [field, op],
            });
            continue;
          }
          if ((op === "$in" || op === "$nin") && !Array.isArray(val)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `"${op}" must be an array`,
              path: [field, op],
            });
          }
          if (op === "$regex") {
            if (typeof val === "string" && val.length > 512) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "$regex pattern too long",
                path: [field, op],
              });
            }
          }
        }
      }
    }
  });

/** CREATE payload: no audienceSize, status forced to draft on server */
export const CampaignCreateIn = z.object({
  createdBy: z.string().min(1, "User ID is required").optional(), // Clerk/Google string id
  name: z.string().min(1, "Campaign name is required"),
  message: z.string().min(1, "Message cannot be empty"),
  segmentRules: SegmentRulesIn,
});

/** UPDATE payload: partial; if segmentRules present, server will recalc audienceSize */
export const CampaignUpdateIn = z.object({
  name: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  segmentRules: SegmentRulesIn.optional(),
}).strict();

/** Explicit status update */
export const CampaignStatusIn = z.object({
  status: z.enum(["draft", "running", "completed"]),
});

/** Query params for list */
export const CampaignListQ = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["draft", "running", "completed"]).optional(),
});


export const NLParseIn = z.object({
  text: z.string().min(1, "Describe your audience in natural language")
});

