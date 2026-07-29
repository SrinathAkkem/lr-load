import { z } from "zod";

export const addressTypeSchema = z.enum(["consigner", "consignee"]);

export const createAddressSchema = z.object({
  type: addressTypeSchema,
  name: z.string().trim().min(1, "Name is required").max(255),
  company: z.string().trim().max(255).optional(),
  address: z.string().trim().min(1, "Address is required"),
  pincode: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(15).optional().default(""),
});

export const updateAddressSchema = createAddressSchema.partial();
