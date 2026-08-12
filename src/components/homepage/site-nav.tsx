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
    <header className="relative z-20 w-full py-[clamp(0.875rem,2vw,1.25rem)]">
      <div className="mkt-container flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/rono-logo.png"
            alt="Rono"
            width={120}
            height={36}
            className="h-[clamp(2rem,4.5vw,2.5rem)] w-auto"
            priority
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LoginButton className="btn-mkt-outline h-9 whitespace-nowrap px-3 text-sm sm:h-10 sm:px-5">
            Login
          </LoginButton>
          <Link
            href="/contact?subject=demo"
            className="btn-mkt-primary h-9 whitespace-nowrap px-3 text-sm sm:h-10 sm:px-5"
          >
            <span className="hidden sm:inline">Request for demo</span>
            <span className="sm:hidden">Demo</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
