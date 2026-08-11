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
    <header className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/">
        <Image src="/rono-logo.png" alt="Rono" width={120} height={36} className="h-9 w-auto" priority />
      </Link>

      <nav className="hidden items-center gap-10 lg:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={
              link.highlight
                ? "text-mkt-nav-active text-[15px] font-medium"
                : "text-[15px] font-medium text-[#1A1A1A]/80 transition hover:text-[#1A1A1A]"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <LoginButton className="btn-mkt-outline px-6 py-2.5 text-sm">Login</LoginButton>
        <Link
          href="/contact?subject=demo"
          className="btn-mkt-primary hidden px-6 py-2.5 text-sm sm:inline-flex"
        >
          Request for demo
        </Link>
      </div>
    </header>
  );
}
