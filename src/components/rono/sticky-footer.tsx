"use client";

import { cn } from "@/lib/utils";

export interface StickyFooterLink {
  label: string;
  href: string;
  /** Hide on very small screens to keep the bar on a single line. */
  hideOnMobile?: boolean;
}

const DEFAULT_LINKS: StickyFooterLink[] = [
  { label: "About Us", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact", hideOnMobile: true },
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms", hideOnMobile: true },
  { label: "Delete Account", href: "#delete-account" },
];

export function StickyFooter({
  companyName = "RonoHub",
  links = DEFAULT_LINKS,
  className,
}: {
  companyName?: string;
  links?: StickyFooterLink[];
  className?: string;
}) {
  const year = new Date().getFullYear();

  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  }

  return (
    <footer
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06]",
        "bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]",
        className,
      )}
    >
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-3 px-3 sm:h-10 sm:px-6">
        <p className="shrink-0 truncate text-[10px] font-medium text-[var(--brand-text-muted)] sm:text-xs">
          © {year} {companyName}. All rights reserved.
        </p>

        <nav className="flex min-w-0 items-center gap-2.5 overflow-x-auto sm:gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className={cn(
                "shrink-0 whitespace-nowrap text-[10px] font-medium text-[var(--brand-text-muted)] transition-opacity duration-150",
                "hover:text-brand hover:opacity-80 hover:underline hover:underline-offset-2",
                "sm:text-xs",
                link.hideOnMobile && "hidden sm:inline",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
