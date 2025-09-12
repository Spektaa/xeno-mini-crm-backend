import { z } from "zod";

export const CommunicationQueryIn = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  campaign: z.string().optional(),
  customer: z.string().optional(),
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
});


export const DeliveryReceiptIn = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  customerId: z.string().min(1, "customerId is required"),
  status: z.enum(["SENT", "FAILED"]),
  vendorResponse: z.string().optional().default(""),
});

export const VendorSendIn = z.object({
  campaignId: z.string().min(1),
  customerId: z.string().min(1),
  message: z.string().min(1),
});


