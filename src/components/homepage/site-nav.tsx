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
    <header className="mkt-container relative z-20 flex min-w-0 items-center justify-between gap-2 py-[clamp(0.875rem,2vw,1.25rem)] sm:gap-3">
      <Link href="/" className="min-w-0 shrink">
        <Image
          src="/rono-logo.png"
          alt="Rono"
          width={120}
          height={36}
          className="h-[clamp(1.75rem,4vw,2.25rem)] w-auto"
          priority
        />
      </Link>

      <nav className="hidden min-w-0 items-center gap-8 lg:flex xl:gap-10">
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

      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
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
    </header>
  );
}
