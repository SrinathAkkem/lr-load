"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function RonoHubLogo() {
  return (
    <div className="w-full text-center">
      <Image
        src="/rono-logo.svg"
        alt="RonoHub"
        width={140}
        height={40}
        className="inline-block h-10 w-auto"
      />
    </div>
  );
}

export default function CompanyLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  async function sendOtp() {
    if (mobile.length !== 10) return;
    setLoading(true);
    setNotRegistered(false);
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
          toast.success(`SMS not configured — use OTP: ${data.data.devOtp}`, {
            duration: 10000,
          });
        } else {
          toast.success("OTP sent. Please check your phone.");
        }
      } else if (res.status === 404) {
        setNotRegistered(true);
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
      <div className="flex min-h-screen items-center justify-center bg-[#F2EFFA]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#5E3EA1]/30 border-t-[#5E3EA1]" />
          <p className="mt-4 text-sm font-semibold text-[#4D4D4D]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Light Purple Background */}
      <aside className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#F2EFFA] p-12 lg:flex">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          {/* Heading */}
          <h1 className="text-[32px] font-bold leading-[40px] text-[#5E3EA1]">
            Run Your Transport Company On Autopilot.
          </h1>
          
          {/* Subtext */}
          <p className="text-sm font-normal leading-[22px] text-[#4D4D4D]">
            Approve LRs, manage executives and track every shipment from a single dashboard.
          </p>
          
          {/* Illustration */}
          <div className="relative h-[400px] w-full">
            <Image
              src="/home-screen.svg"
              alt="Transport logistics illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </aside>

      {/* Right Side - White Background with Form */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile header */}
        <div className="bg-[#F2EFFA] px-6 py-8 text-center lg:hidden">
          <RonoHubLogo />
          <p className="mt-3 text-sm font-semibold text-[#5E3EA1]">
            Run Your Transport Company On Autopilot.
          </p>
        </div>

        <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
          {otpSent && (
            <button
              type="button"
              onClick={() => {
                setOtp("");
                setOtpSent(false);
              }}
              aria-label="Back"
              className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F7] text-black transition hover:bg-black/10 sm:left-10 sm:top-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-full max-w-[418px]">
            {/* Logo */}
            <div className="mb-14 hidden w-full text-center lg:block">
              <RonoHubLogo />
            </div>

            {/* Heading and Subtext */}
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <h2 className="text-[28px] font-bold leading-normal text-black">
                Welcome back!
              </h2>
              <p className="text-sm font-normal leading-[22px] text-[#4D4D4D]">
                Sign in with the mobile number registered by your platform admin.
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6">
              {/* Mobile Number Input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="mobile"
                  className="text-sm font-normal text-black"
                >
                  Mobile Number*
                </label>
                <div className="flex h-[50px] items-center gap-2 rounded-lg bg-[#F5F5F7] px-4 py-3">
                  <span className="text-sm font-normal text-black">
                    +91
                  </span>
                  <input
                    id="mobile"
                    type="text"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setNotRegistered(false);
                    }}
                    placeholder="98756 21234"
                    className="flex-1 border-0 bg-transparent text-sm font-normal text-black outline-none placeholder:text-black/40"
                    autoComplete="tel-national"
                    disabled={otpSent || loading}
                  />
                </div>
                {notRegistered && (
                  <p className="text-xs font-medium text-[#961C1C]">
                    This mobile number isn&apos;t registered.{" "}
                    <Link
                      href={`/company/register?mobile=${mobile}`}
                      className="font-semibold text-[#5E3EA1] underline"
                    >
                      Register your company
                    </Link>{" "}
                    instead.
                  </p>
                )}
              </div>

              {/* OTP Input (shown after Send OTP) */}
              {otpSent && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-normal text-black">
                      Enter OTP*
                    </label>
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-sm text-[#5E3EA1] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <div className="flex h-[50px] items-center justify-center gap-2 rounded-lg bg-[#F5F5F7] px-4 py-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="- - - - - -"
                      maxLength={6}
                      className="flex-1 border-0 bg-transparent text-center text-lg font-normal tracking-[0.5em] text-black outline-none placeholder:tracking-[0.5em] placeholder:text-black/30"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                    }}
                    className="text-left text-xs text-[#5E3EA1] hover:underline"
                  >
                    Wrong number? Edit it.
                  </button>
                </div>
              )}

              {/* Send OTP / Verify Button */}
              {!otpSent ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading || mobile.length !== 10}
                  className="mt-2 flex h-[50px] items-center justify-center rounded-xl bg-black px-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="mt-2 flex h-[50px] items-center justify-center rounded-xl bg-black px-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
              )}
            </div>

            {!otpSent && (
              <p className="mt-6 text-center text-sm text-[#4D4D4D]">
                New to Rono?{" "}
                <Link href="/company/register" className="font-semibold text-[#5E3EA1] hover:underline">
                  Register Now
                </Link>
              </p>
            )}

            {/* Footer Text */}
            <div className="mt-8 text-center text-xs font-normal leading-[18px] text-[#4D4D4D]">
              By signing in you agree to RonoHub&apos;s acceptable-{" "}
              <span className="text-[#5E3EA1] underline">use policy</span>. All
              sign-in events are logged for audit and security review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
