import Image from "next/image";
import { SiteNav } from "./site-nav";
import { LoginButton } from "./login-button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FBFAFE] to-white">
      <SiteNav />

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-2 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <h1 className="text-[40px] font-extrabold leading-[1.15] text-black sm:text-[52px]">
            Manage Your Lorry{" "}
            <span className="bg-gradient-to-r from-[#F7CE25] to-[#F25828] bg-clip-text text-transparent">
              Receipts, Digitally.
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#4D4D4D] sm:text-lg">
            Create, track, and store Lorry Receipts digitally no paperwork, no delays.
          </p>
          <LoginButton className="mt-8 inline-flex h-12 items-center rounded-full bg-gradient-to-r from-[#3C60B6] to-[#5E3EA1] px-7 text-sm font-bold text-white shadow-lg shadow-[#5E3EA1]/20 transition hover:opacity-90">
            Start Free Trial
          </LoginButton>
        </div>

        <div className="relative mx-auto w-full max-w-[580px] lg:max-w-[620px]">
          <Image
            src="/dashboard-preview-web.svg"
            alt="Rono company dashboard showing LR stats and recent activity"
            width={577}
            height={509}
            className="h-auto w-full"
            priority
            sizes="(max-width: 1024px) 100vw, 620px"
          />
        </div>
      </div>
    </section>
  );
}
