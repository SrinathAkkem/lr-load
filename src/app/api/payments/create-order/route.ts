import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRazorpay, SUBSCRIPTION_PLANS } from "@/lib/payments/razorpay";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "company_admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { planId, billing = "monthly" } = body as {
    planId: string;
    billing?: "monthly" | "yearly";
  };

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json(
      { success: false, error: "Invalid plan" },
      { status: 400 },
    );
  }

  const amount =
    billing === "yearly" ? plan.priceYearly * 100 : plan.priceMonthly * 100;

  const company = session.companyId
    ? await prisma.company.findUnique({ where: { id: session.companyId } })
    : null;

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sub_${session.companyId}_${Date.now()}`,
      notes: {
        companyId: session.companyId ?? "",
        companyName: company?.name ?? "",
        planId: plan.id,
        planName: plan.name,
        billing,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan: {
          id: plan.id,
          name: plan.name,
          maxLrPerMonth: plan.maxLrPerMonth,
          maxBranches: plan.maxBranches,
          maxDrivers: plan.maxDrivers,
        },
        prefill: {
          name: session.name,
          contact: company?.contactPhone ?? "",
        },
      },
    });
  } catch (err) {
    console.error("[Razorpay Order Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 },
    );
  }
}
