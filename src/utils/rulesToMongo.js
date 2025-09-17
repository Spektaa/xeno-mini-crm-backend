export function rulesToMongo(rules = {}) {
  const dateFields = new Set(["lastActive", "createdAt"]);
  const out = {};

  for (const [field, obj] of Object.entries(rules)) {
    if (dateFields.has(field) && obj && typeof obj === "object") {
      const inner = {};
      for (const [op, val] of Object.entries(obj)) {
        inner[op] = typeof val === "string" ? new Date(val) : val;
      }
      out[field] = inner;
    } else {
      out[field] = obj;
    }
  }
  return out;
}