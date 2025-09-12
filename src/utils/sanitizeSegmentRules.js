// utils/sanitizeSegmentRules.js
const ALLOWED_FIELDS = new Set(["totalSpend", "visits", "lastActive", "email", "phone", "name"]);
const ALLOWED_OPS = new Set(["$gt", "$gte", "$lt", "$lte", "$eq", "$ne", "$in", "$nin", "$regex"]);

export function sanitizeSegmentRules(rules = {}) {
  const out = {};

  for (const [field, cond] of Object.entries(rules)) {
    if (!ALLOWED_FIELDS.has(field)) continue;

    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      const safeCond = {};
      for (const [op, val] of Object.entries(cond)) {
        if (!ALLOWED_OPS.has(op)) continue;

        if ((op === "$in" || op === "$nin") && !Array.isArray(val)) continue;

        if (op === "$regex") {
          if (val instanceof RegExp) {
            safeCond[op] = val;
          } else if (typeof val === "string" && val.length <= 512) {
            safeCond[op] = val;
          } else {
            continue;
          }
        } else {
          safeCond[op] = val;
        }
      }
      if (Object.keys(safeCond).length) out[field] = safeCond;
    } else {
      // allow direct equality like { visits: 3 }
      out[field] = cond;
    }
  }

  return out;
}
