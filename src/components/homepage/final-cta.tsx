import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "./login-button";

export function FinalCta() {
  return (
    <section className="mkt-container pt-[clamp(2rem,4vw,4rem)]">
      <div className="relative min-w-0">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF5C28] to-[#FDE021] sm:rounded-3xl md:pr-[min(42%,360px)] lg:pr-[min(38%,400px)]">
          <div className="flex min-h-0 flex-col justify-center px-4 py-7 sm:px-8 sm:py-10 md:min-h-[280px] md:px-10 md:py-12 lg:min-h-[320px] lg:px-12">
            <div className="relative z-10 min-w-0 max-w-xl">
              <h2 className="mkt-cta-title text-white">
                Digitize Your Lorry Receipt Process Today
              </h2>
              <p className="mkt-subtitle mt-3 text-white/95 sm:mt-4">
                Create, manage, and track digital Lorry Receipts with one simple platform designed for
                transport businesses.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
                <LoginButton className="inline-flex h-10 w-full min-w-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:opacity-90 sm:h-11 sm:w-auto sm:px-7">
                  Get Started
                </LoginButton>
                <Link
                  href="/contact?subject=demo"
                  className="inline-flex h-10 w-full min-w-0 items-center justify-center rounded-full border border-white px-6 text-sm font-semibold text-white transition hover:bg-white/10 sm:h-11 sm:w-auto sm:px-7"
                >
                  Request a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[clamp(16rem,38vw,23.75rem)] w-[min(46%,340px)] md:block lg:right-4"
          aria-hidden
        >
          <Image
            src="/homepage/cta-user.png"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="(max-width: 1024px) 300px, 380px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
