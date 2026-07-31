import { z } from "zod";

export const paymentModes = ["To Pay", "Paid", "To Be Billed"] as const;

export const createLRSchema = z.object({
  consignorName: z.string().min(1, "Consignor name is required"),
  consignorAddress: z.string().min(1, "Consignor address is required"),
  consigneeCompany: z.string().optional(),
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeAddress: z.string().min(1, "Consignee address is required"),
  consigneePhone: z
    .string()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  originCity: z.string().min(1, "Origin city is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  vehicleNumber: z
    .string()
    .min(1, "Vehicle number is required")
    .transform((v) => v.toUpperCase().replace(/\s/g, "")),
  goodsDescription: z.string().min(1, "Goods description is required"),
  noOfPackages: z.coerce.number().int().positive("Must be a positive whole number"),
  weightKg: z.coerce.number().positive("Weight must be positive"),
  declaredValue: z.coerce.number().positive("Declared value is required"),
  freightAmount: z.coerce.number().positive("Freight amount is required"),
  paymentMode: z.enum(paymentModes),
  dispatchDate: z.string().min(1, "Dispatch date is required"),
  specialInstructions: z.string().optional(),
  photos: z.array(z.string()).max(5).optional().default([]),
  signatureUrl: z.string().min(1, "Authorised signature is required"),
});

export const rejectLRSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export const otpSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createBranchSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
});

export const inviteExecutiveSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/),
  branchId: z.string().min(1),
  name: z.string().optional(),
});

/** @deprecated Use inviteExecutiveSchema */

export const companyLimitsSchema = z.object({
  maxBranches: z.coerce.number().int().positive(),
  maxExecutives: z.coerce.number().int().positive(),
  maxLrPerMonth: z.coerce.number().int().positive(),
});

export const companyProfileSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  gstNumber: z.string().min(1),
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
});
