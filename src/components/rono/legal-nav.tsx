"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "About Us", href: "/legal/about" },
  { label: "FAQ", href: "/legal/faq" },
  { label: "Contact", href: "/legal/contact" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Delete Account", href: "/legal/delete-account" },
];

export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto max-w-3xl overflow-x-auto px-4 py-4 sm:px-6">
      <ul className="flex min-w-max gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-brand-gradient text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
