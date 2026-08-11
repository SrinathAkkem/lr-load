import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "./login-button";

export function FinalCta() {
  return (
    <section className="mkt-container overflow-visible pb-[clamp(2rem,4vw,4rem)] pt-[clamp(2rem,4vw,4rem)]">
      <div className="relative overflow-visible pt-[clamp(0.92rem,1.85vw,1.51rem)]">
        <div className="mkt-cta-banner relative z-0 min-h-[280px] overflow-hidden rounded-3xl md:min-h-[320px] md:pr-[min(40%,380px)] lg:pr-[min(38%,420px)]">
          <div className="relative z-10 flex min-h-[inherit] flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <h2 className="mkt-cta-title">
              Digitize Your Lorry
              <br />
              Receipt Process Today
            </h2>
            <p className="mkt-cta-subtitle mt-4 max-w-lg">
              Create, manage, and track digital Lorry Receipts with one simple platform designed for
              transport businesses.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LoginButton className="btn-mkt-cta-primary h-11 px-7">
                Get Started
              </LoginButton>
              <Link href="/contact?subject=demo" className="btn-mkt-cta-outline h-11 px-7">
                Request a Demo
              </Link>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 right-0 z-20 hidden md:block"
          aria-hidden
        >
          <Image
            src="/homepage/cta-user.png"
            alt=""
            width={530}
            height={556}
            className="mkt-cta-person block w-auto max-w-none"
            sizes="(max-width: 1024px) 320px, 420px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
