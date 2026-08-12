"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

function RonoHubLogo() {
  return (
    <div className="w-full text-center">
      <Image
        src="/rono-logo.svg"
        alt="Rono"
        width={140}
        height={40}
        className="inline-block h-10 w-auto"
      />
    </div>
  );
}

interface FormState {
  name: string;
  lrCode: string;
  gstNumber: string;
  ibaNumber: string;
  address: string;
  contactPhone: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  lrCode: "",
  gstNumber: "",
  ibaNumber: "",
  address: "",
  contactPhone: "",
  email: "",
};

const STEPS = ["Company Details", "Verify Contact", "Review & Create"] as const;

export default function CompanyRegisterPage() {
  return (
    <Suspense fallback={null}>
      <CompanyRegisterForm />
    </Suspense>
  );
}

function CompanyRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const prefillMobile = searchParams.get("mobile");
    if (prefillMobile && /^\d{10}$/.test(prefillMobile)) {
      setForm((f) => ({ ...f, contactPhone: prefillMobile }));
    }
  }, [searchParams]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep1(): string | null {
    if (!form.name.trim()) return "Company name is required";
    if (!form.lrCode.trim()) {
      return "Company code is required";
    }
    if (!form.gstNumber.trim()) return "GST number is required";
    if (!form.address.trim()) return "Address is required";
    if (!/^\d{10}$/.test(form.contactPhone)) return "Enter a valid 10-digit mobile number";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address";
    return null;
  }

  function goToStep2() {
    const err = validateStep1();
    if (err) {
      toast.error(err);
      return;
    }
    setStep(2);
  }

  async function sendMobileOtp() {
    setSendingMobileOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.contactPhone, purpose: "register" }),
      });
      const data = await res.json();
      if (data.success) {
        setMobileOtpSent(true);
        if (data.data?.devOtp) {
          toast.success(`Dev mode — mobile OTP: ${data.data.devOtp}`, { duration: 10000 });
        } else {
          toast.success("OTP sent to your mobile number");
        }
      } else {
        toast.error(data.error ?? "Couldn't send mobile OTP");
      }
    } finally {
      setSendingMobileOtp(false);
    }
  }

  async function verifyMobileOtp() {
    if (mobileOtp.length !== 6) return;
    setSendingMobileOtp(true);
    try {
      const res = await fetch("/api/auth/verify-mobile-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.contactPhone, otp: mobileOtp }),
      });
      const data = await res.json();
      if (data.success) {
        setMobileVerified(true);
        toast.success("Mobile number verified");
      } else {
        toast.error(data.error ?? "Invalid OTP");
      }
    } finally {
      setSendingMobileOtp(false);
    }
  }

  async function createAccount() {
    setCreating(true);
    try {
      const res = await fetch("/api/public/company-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          lrCode: form.lrCode.trim(),
          gstNumber: form.gstNumber.trim(),
          ibaNumber: form.ibaNumber.trim() || undefined,
          contactPhone: form.contactPhone,
          email: form.email.trim().toLowerCase(),
          address: form.address.trim(),
          mobileOtp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreated(true);
        toast.success("Account created! Redirecting to your dashboard…");
        setTimeout(() => {
          router.push("/company/dashboard");
          router.refresh();
        }, 1200);
      } else {
        toast.error(data.error ?? "Couldn't create account");
      }
    } finally {
      setCreating(false);
    }
  }

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2EFFA] px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0C6B24]/10 text-[#0C6B24]">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-black">Account created!</h1>
          <p className="max-w-sm text-sm text-[#4D4D4D]">
            Your company is registered and pending Rono admin approval. You can start setting up
            your dashboard right away — LR creation unlocks once approved.
          </p>
          <div className="mt-2 h-8 w-8 animate-spin rounded-full border-4 border-[#5E3EA1]/30 border-t-[#5E3EA1]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#F2EFFA] p-12 lg:flex">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <h1 className="text-[32px] font-bold leading-[40px] text-[#5E3EA1]">
            Bring Your Transport Business Onboard.
          </h1>
          <p className="text-sm font-normal leading-[22px] text-[#4D4D4D]">
            Register your company in minutes. A Rono admin reviews and approves every new account
            to keep the platform trustworthy.
          </p>
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

      <div className="flex flex-1 flex-col bg-white">
        <div className="bg-[#F2EFFA] px-6 py-8 text-center lg:hidden">
          <RonoHubLogo />
          <p className="mt-3 text-sm font-semibold text-[#5E3EA1]">
            Bring Your Transport Business Onboard.
          </p>
        </div>

        <div className="relative flex flex-1 items-start justify-center p-6 sm:p-10">
          <button
            type="button"
            onClick={() => (step === 1 ? router.push("/company/login") : setStep(step - 1))}
            aria-label="Back"
            className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F7] text-black transition hover:bg-black/10 sm:left-10 sm:top-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="w-full max-w-[480px] pt-16 sm:pt-4">
            <div className="mb-8 hidden w-full text-center lg:block">
              <RonoHubLogo />
            </div>

            {/* Step indicator */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {STEPS.map((label, i) => {
                const idx = i + 1;
                const active = idx === step;
                const done = idx < step;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-[#0C6B24] text-white"
                          : active
                            ? "bg-[#5E3EA1] text-white"
                            : "bg-[#F5F5F7] text-[#9CA3AF]"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : idx}
                    </div>
                    {idx < STEPS.length && (
                      <div className={`h-0.5 w-6 sm:w-10 ${done ? "bg-[#0C6B24]" : "bg-[#F5F5F7]"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mb-6 text-center text-sm font-semibold text-[#5E3EA1]">
              Step {step} of {STEPS.length} — {STEPS[step - 1]}
            </p>

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <Field label="Company Name*">
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. ABC Logistics Pvt. Ltd."
                    className={inputClass}
                  />
                </Field>
                <Field label="Company Code">
                  <input
                    value={form.lrCode}
                    onChange={(e) =>
                      update("lrCode", e.target.value)
                    }
                    placeholder="1234"
                    className={inputClass}
                  />
                </Field>
                <Field label="GST Number*">
                  <input
                    value={form.gstNumber}
                    onChange={(e) => update("gstNumber", e.target.value.toUpperCase())}
                    placeholder="123-12345-123456"
                    className={inputClass}
                  />
                </Field>
                <Field label="IBA Number">
                  <input
                    value={form.ibaNumber}
                    onChange={(e) => update("ibaNumber", e.target.value)}
                    placeholder="123-12345-123456"
                    className={inputClass}
                  />
                </Field>
                <Field label="Registered Address*">
                  <textarea
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    rows={3}
                    placeholder="Full company address"
                    className={`${inputClass} h-auto resize-none py-3`}
                  />
                </Field>
                <Field label="Contact Mobile Number*">
                  <div className="flex h-[50px] items-center gap-2 rounded-lg bg-[#F5F5F7] px-4 py-3">
                    <span className="text-sm font-normal text-black">+91</span>
                    <input
                      value={form.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      inputMode="numeric"
                      placeholder="98756 21234"
                      className="flex-1 border-0 bg-transparent text-sm font-normal text-black outline-none placeholder:text-black/40"
                    />
                  </div>
                </Field>
                <Field label="Email Address*">
                  <input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    type="email"
                    placeholder="admin@company.com"
                    className={inputClass}
                  />
                </Field>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="mt-2 flex h-[50px] items-center justify-center rounded-xl bg-black px-4 text-base font-bold text-white transition-opacity hover:opacity-90"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-black">
                      Mobile: <span className="text-[#4D4D4D]">+91 {form.contactPhone}</span>
                    </p>
                    {mobileVerified && <Check className="h-4 w-4 text-[#0C6B24]" />}
                  </div>
                  {!mobileVerified && (
                    <div className="mt-3">
                      {!mobileOtpSent ? (
                        <button
                          type="button"
                          onClick={sendMobileOtp}
                          disabled={sendingMobileOtp}
                          className="rounded-lg bg-[#5E3EA1] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {sendingMobileOtp ? "Sending…" : "Send OTP"}
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={mobileOtp}
                            onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="6-digit OTP"
                            inputMode="numeric"
                            className="w-32 rounded-lg border border-black/10 px-3 py-2 text-sm tracking-widest outline-none focus:border-[#5E3EA1]/40"
                          />
                          <button
                            type="button"
                            onClick={verifyMobileOtp}
                            disabled={sendingMobileOtp || mobileOtp.length !== 6}
                            className="rounded-lg bg-[#5E3EA1] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            onClick={sendMobileOtp}
                            disabled={sendingMobileOtp}
                            className="text-xs font-semibold text-[#5E3EA1] hover:underline"
                          >
                            Resend
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!mobileVerified}
                  className="mt-2 flex h-[50px] items-center justify-center rounded-xl bg-black px-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl border border-black/10 p-4 text-sm">
                  <ReviewRow label="Company Name" value={form.name} />
                  <ReviewRow label="Company Code" value={form.lrCode} />
                  <ReviewRow label="GST Number" value={form.gstNumber} />
                  {form.ibaNumber && <ReviewRow label="IBA Number" value={form.ibaNumber} />}
                  <ReviewRow label="Address" value={form.address} />
                  <ReviewRow label="Mobile" value={`+91 ${form.contactPhone}`} />
                  <ReviewRow label="Email" value={form.email} last />
                </div>
                <p className="text-xs text-[#4D4D4D]">
                  By creating an account you agree that a Rono admin will review your registration.
                  You&apos;ll be able to sign in and set up your dashboard immediately — LR creation
                  unlocks once approved.
                </p>
                <button
                  type="button"
                  onClick={createAccount}
                  disabled={creating}
                  className="mt-2 flex h-[50px] items-center justify-center rounded-xl bg-black px-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating account…" : "Create Account"}
                </button>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-[#4D4D4D]">
              Already have an account?{" "}
              <Link href="/company/login" className="font-semibold text-[#5E3EA1] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "flex h-[50px] items-center gap-2 rounded-lg bg-[#F5F5F7] px-4 text-sm font-normal text-black outline-none placeholder:text-black/40 border-0";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-normal text-black">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${last ? "" : "border-b border-black/5"}`}>
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="max-w-[60%] text-right font-semibold text-black">{value}</span>
    </div>
  );
}
