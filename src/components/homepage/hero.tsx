import Image from "next/image";
import { cn } from "@/lib/utils";
import { SiteNav } from "./site-nav";
import { LoginButton } from "./login-button";
import {
  MktHeadingAccent,
  MktHeadingText,
  MKT_HERO_TITLE_CLASS,
  MKT_SUBTITLE_CLASS,
} from "./section-heading";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <SiteNav />

      <div className="mkt-container grid min-w-0 grid-cols-1 items-center gap-[clamp(1.5rem,4vw,3rem)] pb-[clamp(2.5rem,5vw,6rem)] pt-1 sm:pt-3 lg:grid-cols-2 lg:pt-8">
        <div className="min-w-0 max-w-xl">
          <h1 className={cn(MKT_HERO_TITLE_CLASS, "min-w-0")}>
            <MktHeadingText>Manage Your Lorry </MktHeadingText>
            <MktHeadingAccent>Receipts, Digitally.</MktHeadingAccent>
          </h1>
          <p className={cn("mt-[clamp(0.75rem,2vw,1.25rem)]", MKT_SUBTITLE_CLASS)}>
            Create, track, and store Lorry Receipts digitally no paperwork, no delays.
          </p>
          <LoginButton className="btn-mkt-primary mt-[clamp(1rem,2.5vw,2rem)] h-11 w-full min-w-0 px-6 sm:w-auto sm:h-12 sm:px-8">
            Start Free Trial
          </LoginButton>
        </div>

        <div className="relative mx-auto min-w-0 w-full">
          <Image
            src="/dashboard-preview-web.svg"
            alt="Rono company dashboard showing LR stats and recent activity"
            width={577}
            height={509}
            className="mkt-hero-visual mx-auto"
            priority
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 620px"
          />
        </div>
      </div>
    </section>
  );
}
