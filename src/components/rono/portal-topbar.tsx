"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarMobile } from "@/components/rono/sidebar-context";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  lrId?: string;
}

interface TopbarProps {
  variant: "super_admin" | "company_admin";
  userName: string;
  userRole: string;
}

const SEARCH_TARGETS: Record<TopbarProps["variant"], string> = {
  super_admin: "/super-admin/companies",
  company_admin: "/company/lr",
};

const TITLE_MAP: Array<{ match: RegExp; title: string; placeholder: string }> = [
  // Super Admin
  {
    match: /^\/super-admin\/dashboard/,
    title: "Dashboard",
    placeholder: "Search companies, executives...",
  },
  {
    match: /^\/super-admin\/companies\/[^/]+/,
    title: "Company Detail",
    placeholder: "Search companies...",
  },
  {
    match: /^\/super-admin\/companies/,
    title: "Companies",
    placeholder: "Search companies...",
  },
  {
    match: /^\/super-admin\/executives/,
    title: "All Executives",
    placeholder: "Search executives by name or mobile...",
  },
  {
    match: /^\/super-admin\/settings/,
    title: "Settings",
    placeholder: "Search settings...",
  },
  {
    match: /^\/super-admin\/audit/,
    title: "Audit Log",
    placeholder: "Search audit events...",
  },
  // Company Admin
  {
    match: /^\/company\/dashboard/,
    title: "Dashboard",
    placeholder: "Search LRs, executives...",
  },
  {
    match: /^\/company\/lr\/[^/]+/,
    title: "LR Detail",
    placeholder: "Search by LR number...",
  },
  {
    match: /^\/company\/lr/,
    title: "LR Management",
    placeholder: "Search by LR number...",
  },
  {
    match: /^\/company\/branches/,
    title: "Branch Management",
    placeholder: "Search branches...",
  },
  {
    match: /^\/company\/executives/,
    title: "Executive Management",
    placeholder: "Search by name or mobile...",
  },
  {
    match: /^\/company\/reports/,
    title: "Reports",
    placeholder: "Search reports...",
  },
  {
    match: /^\/company\/profile/,
    title: "Company Profile",
    placeholder: "Search...",
  },
];

function deriveContext(pathname: string) {
  for (const entry of TITLE_MAP) {
    if (entry.match.test(pathname)) {
      return { title: entry.title, placeholder: entry.placeholder };
    }
  }
  return { title: "RonoHub", placeholder: "Search anything..." };
}

export function PortalTopbar({ variant, userName, userRole }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") ?? searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  const { toggle: toggleSidebar } = useSidebarMobile();
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const { title, placeholder } = useMemo(
    () => deriveContext(pathname),
    [pathname],
  );

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!notifsOpen) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifsOpen]);

  useEffect(() => {
    if (!notifsOpen) return;
    let cancelled = false;
    setLoadingNotifs(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.success) setNotifications(d.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingNotifs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notifsOpen]);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const target = SEARCH_TARGETS[variant];
    // Reuse the page's own search param when we're already on its page so
    // the in-page table updates instead of navigating away.
    if (pathname.startsWith(target.split("?")[0])) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", q);
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`${target}?search=${encodeURIComponent(q)}`);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e8edf5] bg-white px-4 py-3.5 md:gap-4 md:px-8">
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-white text-[var(--brand-text-muted)] transition hover:border-brand hover:text-brand md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="truncate text-base font-extrabold text-[#2d2d4e] md:text-lg">
        {title}
      </h1>

      <form
        onSubmit={submitSearch}
        className="relative mx-auto hidden max-w-sm flex-1 md:block"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] pl-9 pr-4 py-2 text-sm font-semibold text-[var(--brand-text)] outline-none transition placeholder:text-[var(--brand-text-muted)] focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative" ref={popRef}>
          <button
            type="button"
            onClick={() => setNotifsOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-white text-[var(--brand-text-muted)] transition hover:border-brand hover:text-brand hover:bg-brand-gradient-soft"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-[#e74c3c] to-[#d43f2f] px-0.5 text-[9px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border-0 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-[#e8edf5] px-4 py-3">
                <p className="text-sm font-bold text-[#2d2d4e]">Notifications</p>
                <span className="text-[11px] font-bold text-[#9ca3af]">
                  {unreadCount} unread
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <p className="p-6 text-center text-sm font-semibold text-[#9ca3af]">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm font-semibold text-[#9ca3af]">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "border-b border-[#e8edf5] px-4 py-3 last:border-0",
                        !n.read && "bg-brand-gradient-soft",
                      )}
                    >
                      <p className="text-sm font-bold text-[#2d2d4e]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-[#6b7280]">{n.message}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          href={
            variant === "super_admin"
              ? "/super-admin/settings"
              : "/company/profile"
          }
          className="flex items-center gap-2.5 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-1.5 text-left transition hover:border-brand"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            {initials || "U"}
          </span>
          <span className="hidden md:block">
            <span className="block text-[13px] font-bold leading-4 text-[#2d2d4e]">
              {userName}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
              {userRole}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
