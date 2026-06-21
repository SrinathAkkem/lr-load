import Razorpay from "razorpay";
import crypto from "crypto";

let instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables",
      );
    }
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return instance;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    description: "For small transporters",
    maxLrPerMonth: 200,
    maxBranches: 3,
    maxDrivers: 20,
    priceMonthly: 999,
    priceYearly: 9990,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses",
    maxLrPerMonth: 500,
    maxBranches: 10,
    maxDrivers: 50,
    priceMonthly: 2499,
    priceYearly: 24990,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large logistics companies",
    maxLrPerMonth: 2000,
    maxBranches: 25,
    maxDrivers: 200,
    priceMonthly: 4999,
    priceYearly: 49990,
  },
] as const;

export type PlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];
