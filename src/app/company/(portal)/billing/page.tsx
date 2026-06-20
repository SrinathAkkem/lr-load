"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Zap, Building2, Users, FileText } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  maxLrPerMonth: number;
  maxBranches: number;
  maxDrivers: number;
  priceMonthly: number;
  priceYearly: number;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [processing, setProcessing] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/payments/plans")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlans(d.data); });
  }, []);

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  async function handleSubscribe(planId: string) {
    if (!scriptLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }
    setProcessing(planId);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Failed to create order");
        return;
      }

      const { orderId, amount, currency, keyId, prefill } = data.data;

      const options: RazorpayOptions = {
        key: keyId,
        amount,
        currency,
        name: "RonoHub",
        description: `${data.data.plan.name} Plan - ${billing === "yearly" ? "Annual" : "Monthly"}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              planId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success(verifyData.data.message);
            window.location.reload();
          } else {
            toast.error(verifyData.error ?? "Payment verification failed");
          }
        },
        prefill: {
          name: prefill.name,
          contact: prefill.contact,
        },
        theme: { color: "#6d28d9" },
        modal: { ondismiss: () => setProcessing(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  const planColors = {
    basic: { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
    professional: { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-600 text-white" },
    enterprise: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription & Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a plan that fits your business needs</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              billing === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              billing === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Yearly <span className="ml-1 text-emerald-600">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const colors = planColors[plan.id as keyof typeof planColors] ?? planColors.basic;
          const price = billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const isPopular = plan.id === "professional";

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm transition hover:shadow-md ${
                isPopular ? "border-violet-400 ring-2 ring-violet-100" : colors.border
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase text-white">
                  Most Popular
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${colors.badge}`}>
                  {plan.name}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-slate-400">
                  /{billing === "yearly" ? "year" : "month"}
                </span>
              </div>

              <ul className="mt-5 space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4 text-violet-500" />
                  <span>{plan.maxLrPerMonth} LRs / month</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>{plan.maxBranches} branches</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span>{plan.maxDrivers} drivers</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>PDF & QR generation</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Reports & analytics</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={processing === plan.id}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  isPopular
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {processing === plan.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {processing === plan.id ? "Processing..." : "Subscribe Now"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Zap className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Secure Payments via Razorpay</h3>
            <p className="text-xs text-slate-500">
              All payments are processed securely through Razorpay. Supports UPI, Cards, Net Banking, and Wallets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
