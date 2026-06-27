import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: SUBSCRIPTION_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      maxLrPerMonth: plan.maxLrPerMonth,
      maxBranches: plan.maxBranches,
      maxExecutives: plan.maxExecutives,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
    })),
  });
}
