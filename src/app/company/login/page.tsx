"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RonoLogo, RonoGradientButton } from "@/components/rono/brand";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function sendOtp() {
    if (mobile.length !== 10) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.data?.devOtp) {
          // SMS isn't configured in this environment — surface the dev OTP
          // the same way the mobile app does, instead of leaving the user
          // waiting for an SMS that will never arrive.
          toast.success(`SMS not configured — use OTP: ${data.data.devOtp}`, {
            duration: 10000,
          });
        } else {
          toast.success("OTP sent. Please check your phone.");
        }
      } else {
        toast.error(data.error ?? "Couldn't send OTP");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.user.role !== "company_admin") {
          toast.error("This login is for company admins only");
          setLoading(false);
          return;
        }
        setRedirecting(true);
        router.push("/company/dashboard");
        router.refresh();
      } else {
        toast.error(data.error ?? "Invalid OTP");
        setLoading(false);
      }
    } catch {
      toast.error("Network error. Please retry.");
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gradient-sidebar">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <p className="mt-4 text-sm font-semibold text-white/80">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient-sidebar p-12 text-white lg:flex">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10">
          <RonoLogo className="text-white [&_span]:text-white" />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight">
            Run your transport company on autopilot.
          </h1>
          <p className="mt-4 text-lg font-semibold text-white/60">
            Approve LRs, manage executives and track every shipment from a single
            dashboard. Powered by RonoHub.
          </p>
        </div>

        <div className="relative z-10 flex gap-2">
          <span className="h-2 w-6 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-white/30" />
          <span className="h-2 w-2 rounded-full bg-white/30" />
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <RonoLogo />
          </div>

          <h2 className="text-2xl font-extrabold text-[#2d2d4e]">Welcome back</h2>
          <p className="mt-2 text-sm font-semibold text-[#9ca3af]">
            Sign in with the mobile number registered by your platform admin.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-brand">
                <span className="font-semibold text-slate-500">+91</span>
                <input
                  id="mobile"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="98765 43210"
                  className="flex-1 border-0 bg-transparent outline-none"
                  autoComplete="tel-national"
                  disabled={otpSent}
                />
              </div>
            </div>

            {!otpSent ? (
              <RonoGradientButton
                type="button"
                onClick={sendOtp}
                disabled={loading || mobile.length !== 10}
                className="w-full"
              >
                {loading ? "Sending..." : "Send OTP"}
              </RonoGradientButton>
            ) : (
              <>
                <div>
                  <Label>Enter 6-digit OTP</Label>
                  <div className="mt-1.5 flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                    }}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Wrong number? Edit it.
                  </button>
                </div>
                <RonoGradientButton
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify"}
                </RonoGradientButton>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="block w-full text-center text-xs text-slate-500 hover:text-primary"
                >
                  Resend
                </button>
              </>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            By signing in you agree to RonoHub&apos;s acceptable-use policy. All
            sign-in events are logged for audit and security review.
          </div>
        </div>
      </div>
    </div>
  );
}
