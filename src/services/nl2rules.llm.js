  import OpenAI from "openai";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Fallback clone for older Node versions
  const clone = global.structuredClone ?? ((o) => JSON.parse(JSON.stringify(o)));

  function toISO(x) {
    const d = new Date(x);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function sanitize(rules = {}) {
    const out = clone(rules || {});
    if (out.lastActive) {
      for (const k of ["$gte", "$lte"]) {
        if (out.lastActive[k]) {
          const iso = toISO(out.lastActive[k]);
          if (!iso) delete out.lastActive[k]; else out.lastActive[k] = iso;
        }
      }
      if (!Object.keys(out.lastActive).length) delete out.lastActive;
    }
    if (out.city) {
      if (typeof out.city.$eq === "string") out.city.$eq = out.city.$eq.trim().toLowerCase();
      for (const k of ["$in","$nin"]) {
        if (Array.isArray(out.city[k])) {
          out.city[k] = out.city[k].map(s => String(s).trim().toLowerCase()).filter(Boolean);
        }
      }
      if (!Object.keys(out.city).length) delete out.city;
    }
    if (out.tags) {
      for (const k of ["$in","$nin"]) {
        if (Array.isArray(out.tags[k])) {
          out.tags[k] = out.tags[k].map(s => String(s).trim()).filter(Boolean);
        }
      }
      if (!Object.keys(out.tags).length) delete out.tags;
    }
    return out;
  }

  export async function nlToRulesLLM(nlText) {
    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
  Return ONLY a JSON object. Fields allowed: totalSpend, visits, lastActive, city, tags.
  Operators: $gte,$gt,$lte,$lt,$eq,$ne (numbers); $gte,$lte (dates ISO); $eq/$in/$nin (strings/arrays).
  Normalize "₹5k","2 lakh","1.5m" to absolute numbers.
  "haven’t shopped in 6 months" -> lastActive: {"$lte": ISO(6 months ago)}.
  "in the last 30 days" -> lastActive: {"$gte": ISO(30 days ago)}.
  If a field isn’t implied, omit it. No comments—just JSON.

  Text: """${nlText}"""`,
      // ✅ Responses API expects an object for text.format
      text: { format: { type: "json_object" } }
    });

    const jsonText =
      resp.output_text ??
      resp.output?.[0]?.content?.[0]?.text;

    const obj = typeof jsonText === "string" ? JSON.parse(jsonText) : (jsonText ?? {});
    return sanitize(obj);
  }
