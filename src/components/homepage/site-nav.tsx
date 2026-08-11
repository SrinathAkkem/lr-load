"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "./login-button";

const NAV_LINKS = [
  { label: "Home", href: "/", highlight: true as const },
  { label: "About", href: "/#about", highlight: false as const },
  { label: "Pricing", href: "/contact?subject=pricing", highlight: false as const },
  { label: "Contact Us", href: "/contact", highlight: false as const },
] as const;

export function SiteNav() {
  return (
    <header className="relative z-20 w-full overflow-visible py-[clamp(0.875rem,2vw,1.25rem)]">
      <Link
        href="/"
        className="absolute top-1/2 z-30 -translate-y-1/2 left-[-1rem] sm:left-[-1.25rem] lg:left-[-1.5rem]"
      >
        <Image
          src="/rono-logo.png"
          alt="Rono"
          width={120}
          height={36}
          className="h-[clamp(2.25rem,5vw,2.75rem)] w-auto"
          priority
        />
      </Link>

      <div className="mkt-container flex items-center justify-between gap-2 pl-[clamp(5.75rem,21vw,9rem)] sm:gap-3">
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 lg:flex xl:gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                link.highlight
                  ? "text-mkt-nav-active whitespace-nowrap text-[15px] font-medium"
                  : "whitespace-nowrap text-[15px] font-medium text-[#1A1A1A]/80 transition hover:text-[#1A1A1A]"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3 lg:ml-0">
          <LoginButton className="btn-mkt-outline h-9 whitespace-nowrap px-3 sm:px-4 sm:h-10 md:px-6">
            Login
          </LoginButton>
          <Link
            href="/contact?subject=demo"
            className="btn-mkt-primary hidden h-9 whitespace-nowrap px-3 text-xs md:inline-flex md:px-4 lg:h-10 lg:px-6 lg:text-sm"
          >
            <span className="hidden lg:inline">Request for demo</span>
            <span className="lg:hidden">Demo</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
