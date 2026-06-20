import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyPaymentSignature, SUBSCRIPTION_PLANS } from "@/lib/payments/razorpay";
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
    body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      planId: string;
    };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { success: false, error: "Missing payment details" },
      { status: 400 },
    );
  }

  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 400 },
    );
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan || !session.companyId) {
    return NextResponse.json(
      { success: false, error: "Invalid plan or company" },
      { status: 400 },
    );
  }

  try {
    await prisma.company.update({
      where: { id: session.companyId },
      data: {
        maxLrPerMonth: plan.maxLrPerMonth,
        maxBranches: plan.maxBranches,
        maxDrivers: plan.maxDrivers,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        actorRole: "company_admin",
        companyId: session.companyId,
        action: "subscription_payment",
        target: plan.name,
        metadata: {
          planId: plan.id,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          maxLrPerMonth: plan.maxLrPerMonth,
          maxBranches: plan.maxBranches,
          maxDrivers: plan.maxDrivers,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Upgraded to ${plan.name} plan successfully`,
        plan: {
          id: plan.id,
          name: plan.name,
          maxLrPerMonth: plan.maxLrPerMonth,
          maxBranches: plan.maxBranches,
          maxDrivers: plan.maxDrivers,
        },
      },
    });
  } catch (err) {
    console.error("[Payment Verification Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to process payment" },
      { status: 500 },
    );
  }
}
