import Image from "next/image";
import { SiteNav } from "./site-nav";
import { LoginButton } from "./login-button";
import { MktHeadingAccent, MktHeadingText } from "./section-heading";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <SiteNav />

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-8 lg:grid-cols-2 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <h1 className="shrink-0 text-[32px] font-semibold leading-tight sm:text-[44px] lg:text-[56px]">
            <MktHeadingText>Manage Your Lorry </MktHeadingText>
            <MktHeadingAccent>Receipts, Digitally.</MktHeadingAccent>
          </h1>
          <p className="mt-6 max-w-[796px] text-lg text-[#4E4E4E] sm:text-xl lg:text-[26px]">
            Create, track, and store Lorry Receipts digitally no paperwork, no delays.
          </p>
          <LoginButton className="btn-mkt-primary mt-8 h-12 px-8 text-sm">
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
