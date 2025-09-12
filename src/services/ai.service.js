// backend/src/services/ai.service.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60_000,
  maxRetries: 3,
});

export async function suggestMessages({
  objective,
  audience = "general users",
  brand = "Your Brand",
  tone = "friendly, action-oriented",
  channels = ["sms", "email", "push", "whatsapp"], // adjust if you wish
}) {
  const prompt = [
    `You are a CRM copywriting assistant for SMS/WhatsApp/push/email.`,
    `Objective: ${objective}`,
    `Audience: ${audience}`,
    `Brand: ${brand}`,
    `Tone: ${tone}`,
    `Return ONLY JSON conforming to the schema.`,
    `Guidelines:`,
    `- 2–3 variants.`,
    `- SMS/push shorter; email can be a bit longer.`,
    `- Clear CTA; simple language.`,
  ].join("\n");

  const resp = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.3,
    text: {
      format: {
        type: "json_schema",
        name: "MessageIdeas",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["variants"],
          properties: {
            variants: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                // IMPORTANT: include every key in `required`
                required: ["headline", "channel", "copy"],
                properties: {
                  headline: { type: "string" },
                  channel: { type: "string", enum: channels },
                  copy: { type: "string", minLength: 1 }
                }
              }
            }
          }
        }
      }
    }
  });

  // The structured JSON is returned as text in this mode
  const parsed = JSON.parse(resp.output_text);
  // Return exactly what the frontend expects:
  return parsed.variants?.slice(0, 3) ?? [];
}
