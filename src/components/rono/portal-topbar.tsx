"use client";

import { Bell, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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
    placeholder: "Search companies, drivers...",
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
    match: /^\/super-admin\/drivers/,
    title: "All Drivers",
    placeholder: "Search drivers by name or mobile...",
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
    placeholder: "Search LRs, drivers...",
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
    match: /^\/company\/drivers/,
    title: "Driver Management",
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
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur md:px-8">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {variant === "super_admin" ? "Super Admin" : "Company Admin"}
        </p>
        <h1 className="truncate text-lg font-bold text-slate-900 md:text-xl">
          {title}
        </h1>
      </div>

      <form
        onSubmit={submitSearch}
        className="relative order-3 w-full max-w-md md:order-2 md:w-auto md:flex-1"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
      </form>

      <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
        <div className="relative" ref={popRef}>
          <button
            type="button"
            onClick={() => setNotifsOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <span className="text-[11px] text-slate-400">
                  {unreadCount} unread
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <p className="p-6 text-center text-sm text-slate-400">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-400">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "border-b border-slate-100 px-4 py-3 last:border-0",
                        !n.read && "bg-violet-50/40",
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
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
          className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2 py-1 pr-4 text-left transition hover:border-violet-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-bold text-white">
            {initials || "U"}
          </span>
          <span className="hidden md:block">
            <span className="block text-sm font-semibold leading-4 text-slate-800">
              {userName}
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400">
              {userRole}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
