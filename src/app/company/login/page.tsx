"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RonoLogo, RonoGradientButton } from "@/components/rono/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";

type Mode = "password" | "otp";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  // Password tab state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP tab state
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Enter your mobile/email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      setRedirecting(true);
      router.push("/company/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error. Please retry.");
      setLoading(false);
    }
  }

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
        toast.success("OTP sent. Please check your phone.");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-300 border-t-white" />
          <p className="mt-4 text-sm font-medium text-violet-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(244,114,182,0.4), transparent 45%)",
          }}
        />
        <div className="relative">
          <RonoLogo className="text-white [&_span]:text-white" />
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Run your transport company on autopilot.
          </h1>
          <p className="mt-4 text-lg text-violet-200">
            Approve LRs, manage drivers and track every shipment from a single
            dashboard. Powered by RonoHub.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-violet-100">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
              Audit-grade trail for every approval and rejection.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
              Branded LR PDFs with QR codes auto-generated on approval.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
              Per-company quotas managed by the platform admin.
            </li>
          </ul>
        </div>

        <div className="relative flex gap-2">
          <span className="h-1.5 w-8 rounded-full bg-white" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <RonoLogo />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your fleet, branches, and lorry receipts.
          </p>

          <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${
                mode === "password"
                  ? "bg-white text-violet-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("otp")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${
                mode === "otp"
                  ? "bg-white text-violet-700 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              OTP
            </button>
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="identifier">Mobile or Email</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="9876543210 or admin@company.com"
                  className="mt-1.5"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Don&apos;t have a password yet? Use OTP to sign in and set
                  one later from your profile.
                </p>
              </div>

              <RonoGradientButton
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in…" : "Sign In"}
              </RonoGradientButton>
            </form>
          ) : (
            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
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
                  {loading ? "Sending…" : "Send OTP"}
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
                      className="mt-2 text-xs text-violet-600 hover:underline"
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
                    {loading ? "Verifying…" : "Verify & Sign In"}
                  </RonoGradientButton>
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                    className="block w-full text-center text-xs text-slate-500 hover:text-violet-700"
                  >
                    Didn&apos;t get the code? Resend
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            By signing in you agree to RonoHub&apos;s acceptable-use policy. All
            sign-in events are logged for audit and security review.
          </div>
        </div>
      </div>
    </div>
  );
}
