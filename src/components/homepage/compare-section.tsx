import { Check } from "lucide-react";
import Image from "next/image";
import { LoginButton } from "./login-button";
import { SectionHeading, MktHeadingAccent, MktHeadingText } from "./section-heading";

const OLD_WAY = [
  "No centralized control",
  "Manual registers and paperwork",
  "Payment confusion and tracking issues",
  "Scattered data across calls and WhatsApp",
];

const RONO_WAY = [
  "One app for everything",
  "Real-time tracking and updates",
  "Clear financial visibility",
  "Fully organized business operations",
];

export function CompareSection() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10 lg:py-20">
      <SectionHeading
        title={
          <>
            <MktHeadingText>There&apos;s a Better Way to </MktHeadingText>
            <MktHeadingAccent>Run Your Fleet</MktHeadingAccent>
          </>
        }
        subtitle="Compare how much time and confusion you save with Rono."
      />

      <div className="relative mx-auto mt-12 max-w-[1040px] lg:mt-16 lg:min-h-[500px]">
        <div className="rounded-3xl border border-[#E5E5E5] bg-[#F7F7F7] p-8 sm:p-10 lg:absolute lg:left-0 lg:top-12 lg:z-0 lg:w-[68%] lg:pb-12">
          <h3 className="text-xl font-semibold text-black sm:text-2xl">Old Transport Workflow</h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#666666] sm:text-[15px]">
            Traditional transport operations rely on paperwork, WhatsApp messages, phone calls,
            and disconnected records that create delays, payment confusion, and a lack of
            visibility.
          </p>
          <ul className="mt-6 space-y-3.5">
            {OLD_WAY.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#666666] sm:text-[15px]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#666666]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-6 overflow-hidden rounded-3xl border border-[#C9B8E8] bg-white p-8 shadow-[0_24px_64px_rgba(80,48,142,0.14)] sm:p-10 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:w-[52%]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#50308E]/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#4882C2]/8 blur-3xl"
          />

          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <Image src="/rono-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
            </span>
            <h3 className="text-xl font-semibold text-black sm:text-2xl">The Rono Way</h3>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-[#666666] sm:text-[15px]">
            RONO digitizes the entire LR process, helping transport businesses create, store, and
            manage lorry receipts quickly and securely from a single platform.
          </p>
          <ul className="relative mt-6 space-y-3.5">
            {RONO_WAY.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-black sm:text-[15px]">
                <Check className="h-4 w-4 shrink-0 stroke-[3] text-[#4CAF50]" />
                {item}
              </li>
            ))}
          </ul>
          <LoginButton className="btn-mkt-primary relative mt-8 h-11 px-8 text-sm">
            Get Started
          </LoginButton>
        </div>
      </div>
    </section>
  );
}
