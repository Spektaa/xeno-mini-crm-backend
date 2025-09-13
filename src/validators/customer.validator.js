import { z } from "zod";

export const CustomerIn = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email(),
  phone: z.string().optional(),
  totalSpend: z.coerce.number().finite().optional(),
  visits: z.coerce.number().int().optional(),
  lastActive: z.preprocess(
    (v) => (typeof v === "string" && v ? new Date(v) : v),
    z.date().optional()
  ),
  city: z.string().optional(),
});