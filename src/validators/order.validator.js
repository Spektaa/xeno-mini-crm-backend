import { z } from "zod";

export const OrderIn = z.object({
  customer: z.string().min(1, "Customer ID is required"), // ObjectId string
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative()
    })
  ).min(1, "At least one item required"),
  orderDate: z.preprocess(
    (val) => (val ? new Date(val) : new Date()),
    z.date()
  )
}).strict();