import { z } from "zod";

export const CustomerIn = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  phone: z.string().optional(),
  totalSpend: z.number().nonnegative().default(0),
  lastActive: z.preprocess((val) => (val ? new Date(val) : new Date()), z.date()),
  visits: z.number().int().nonnegative().default(0)
});
