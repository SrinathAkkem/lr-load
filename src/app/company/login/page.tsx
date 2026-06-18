"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RonoLogo, RonoGradientButton } from "@/components/rono/brand";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("9876543210");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
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
        toast.success("OTP sent! Use 123456 for demo");
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
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
          toast.error("This login is for Company Admins only");
          return;
        }
        router.push("/company/dashboard");
        router.refresh();
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <div className="bg-gradient-to-b from-violet-700 to-violet-900 px-6 pb-8 pt-12 text-center text-white">
        <RonoLogo className="justify-center text-white [&_span]:text-white" />
        <h1 className="mt-6 text-2xl font-bold">Company Admin</h1>
        <p className="mt-1 text-violet-200">Sign in to manage your fleet & LRs</p>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Mobile Number</label>
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="+91 98765 43210"
            className="mt-2"
          />
        </div>

        <RonoGradientButton onClick={sendOtp} disabled={loading || mobile.length !== 10} className="w-full">
          Send OTP
        </RonoGradientButton>

        {otpSent && (
          <>
            <p className="text-center text-sm text-slate-500">Enter OTP sent to your number</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <RonoGradientButton onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full">
              Verify & Login
            </RonoGradientButton>
          </>
        )}
      </div>
    </div>
  );
}
