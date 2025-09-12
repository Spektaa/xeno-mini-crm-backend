import { nlToRulesLLM } from "../services/nl2rules.llm.js";

export const parseNLToRules = async (req, res) => {
  try {
    const { text } = req.body || {};
    const rules = await nlToRulesLLM(text);
    return res.json({ ok: true, rules });
  } catch (e) {
    console.error("NL→Rules failed:", e);
    return res.status(502).json({
      ok: false,
      message: "Could not parse audience via AI. Try rephrasing."
    });
  }
};
