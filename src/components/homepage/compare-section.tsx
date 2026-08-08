import Image from "next/image";
import { Check } from "lucide-react";
import { LoginButton } from "./login-button";

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
      <h2 className="text-center text-3xl font-extrabold text-black sm:text-4xl">
        There&apos;s a Better Way to{" "}
        <span className="text-[#F25828]">Run Your Fleet</span>
      </h2>
      <p className="mt-3 text-center text-base text-[#4D4D4D]">
        Compare how much time and confusion you save with Rono.
      </p>

      <div className="relative mx-auto mt-12 max-w-[1040px] lg:mt-16 lg:min-h-[500px]">
        <div className="rounded-3xl bg-[#EBEBEF] p-8 sm:p-10 lg:absolute lg:left-0 lg:top-12 lg:z-0 lg:w-[68%] lg:pb-12">
          <h3 className="text-xl font-bold text-black sm:text-2xl">Old Transport Workflow</h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
            Traditional transport operations rely on paperwork, WhatsApp messages, phone calls,
            and disconnected records that create delays, payment confusion, and a lack of
            visibility.
          </p>
          <ul className="mt-6 space-y-3.5">
            {OLD_WAY.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#4D4D4D] sm:text-[15px]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#6B7280]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-6 overflow-hidden rounded-3xl border border-[#5E3EA1]/25 bg-white p-8 shadow-[0_24px_64px_rgba(94,62,161,0.14)] sm:p-10 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:w-[52%]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 top-0 h-full w-1/2 bg-gradient-to-l from-[#5E3EA1]/12 via-[#5E3EA1]/5 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#5E3EA1]/10 blur-3xl"
          />

          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <Image src="/rono-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
            </span>
            <h3 className="text-xl font-bold text-black sm:text-2xl">The Rono Way</h3>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-[#4D4D4D] sm:text-[15px]">
            RONO digitizes the entire LR process, helping transport businesses create, store, and
            manage lorry receipts quickly and securely from a single platform.
          </p>
          <ul className="relative mt-6 space-y-3.5">
            {RONO_WAY.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-black sm:text-[15px]">
                <Check className="h-4 w-4 shrink-0 stroke-[3] text-[#0C6B24]" />
                {item}
              </li>
            ))}
          </ul>
          <LoginButton className="relative mt-8 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-[#3C60B6] to-[#5E3EA1] px-7 text-sm font-bold text-white shadow-md transition hover:opacity-90">
            Get Started
          </LoginButton>
        </div>
      </div>
    </section>
  );
}
