import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "./login-button";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-[1440px] overflow-visible px-2 pt-14 lg:px-8 lg:pt-16">
      <div className="relative overflow-visible">
        <div className="rounded-3xl bg-gradient-to-r from-[#F25828] to-[#F7CE25]">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start gap-6 px-8 py-12 sm:px-12 lg:max-w-xl lg:py-14">
              <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Digitize Your Lorry Receipt Process Today
              </h2>
              <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                Create, manage, and track digital Lorry Receipts with one simple platform designed for
                transport businesses.
              </p>
              <div className="flex flex-wrap gap-3">
                <LoginButton className="h-11 rounded-full bg-white px-6 text-sm font-bold text-black transition hover:opacity-90">
                  Get Started
                </LoginButton>
                <Link
                  href="/contact?subject=demo"
                  className="inline-flex h-11 items-center rounded-full border border-white px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Request a Demo
                </Link>
              </div>
            </div>

            <div
              aria-hidden
              className="hidden shrink-0 sm:block sm:w-40 md:w-48 lg:w-56 xl:w-64"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -top-24 bottom-0 -right-10 hidden w-[280px] sm:block sm:-right-8 md:w-[340px] lg:-right-10 lg:w-[400px] xl:-right-14 xl:w-[480px]">
          <Image
            src="/homepage/cta-user.png"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="(max-width: 768px) 280px, (max-width: 1024px) 340px, 480px"
          />
        </div>
      </div>
    </section>
  );
}
