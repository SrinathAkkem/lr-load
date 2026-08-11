import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "./login-button";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-6 pt-14 lg:px-10 lg:pt-16">
      <div className="relative">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF5C28] to-[#FDE021] sm:pr-[min(42%,360px)] lg:pr-[min(38%,400px)]">
          <div className="flex min-h-[280px] flex-col justify-center px-8 py-12 sm:min-h-[300px] sm:px-12 lg:min-h-[320px] lg:py-14">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl font-semibold leading-[1.2] text-white sm:text-[40px]">
                Digitize Your Lorry Receipt Process Today
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white">
                Create, manage, and track digital Lorry Receipts with one simple platform designed for
                transport businesses.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LoginButton className="inline-flex h-11 items-center rounded-full bg-white px-7 text-sm font-bold text-black transition hover:opacity-90">
                  Get Started
                </LoginButton>
                <Link
                  href="/contact?subject=demo"
                  className="inline-flex h-11 items-center rounded-full border border-white px-7 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Request a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 right-4 hidden h-[340px] w-[min(46%,340px)] sm:block lg:right-8 lg:h-[380px] lg:w-[min(40%,380px)]"
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
