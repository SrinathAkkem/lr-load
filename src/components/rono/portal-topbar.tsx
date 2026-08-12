"use client";

import { Bell, ChevronDown, Menu, User, LogOut, X } from "lucide-react";
import { IconSearch, IconDocument } from "@/components/rono/dashboard-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarMobile } from "@/components/rono/sidebar-context";
import { mediaUrl } from "@/lib/media-url";

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
  companyLogoUrl?: string | null;
}

const SEARCH_TARGETS: Record<TopbarProps["variant"], string> = {
  super_admin: "/super-admin1992/companies",
  company_admin: "/company/lr",
};

const TITLE_MAP: Array<{ match: RegExp; title: string; placeholder: string }> = [
  // Super Admin
  {
    match: /^\/super-admin1992\/dashboard/,
    title: "Dashboard",
    placeholder: "Search companies, executives...",
  },
  {
    match: /^\/super-admin1992\/companies\/[^/]+/,
    title: "Company Detail",
    placeholder: "Search companies...",
  },
  {
    match: /^\/super-admin1992\/companies/,
    title: "Companies",
    placeholder: "Search companies...",
  },
  {
    match: /^\/super-admin1992\/executives/,
    title: "All Executives",
    placeholder: "Search executives by name or mobile...",
  },
  {
    match: /^\/super-admin1992\/settings/,
    title: "Settings",
    placeholder: "Search settings...",
  },
  {
    match: /^\/super-admin1992\/audit/,
    title: "Audit Log",
    placeholder: "Search audit events...",
  },
  // Company Admin
  {
    match: /^\/company\/dashboard/,
    title: "Dashboard",
    placeholder: "Search LRs, Executive",
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

function getNotifTone(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("reject")) return { bg: "bg-[#961C1C]/20", color: "text-[#961C1C]" };
  if (text.includes("approv")) return { bg: "bg-[#0C6B24]/10", color: "text-[#0C6B24]" };
  if (text.includes("deliver")) return { bg: "bg-[#3C60B6]/10", color: "text-[#3C60B6]" };
  return { bg: "bg-[#F7CE25]/20", color: "text-[#967E1C]" };
}

function deriveContext(pathname: string) {
  for (const entry of TITLE_MAP) {
    if (entry.match.test(pathname)) {
      return { title: entry.title, placeholder: entry.placeholder };
    }
  }
  return { title: "", placeholder: "Search anything..." };
}

export function PortalTopbar({ variant, userName, userRole, companyLogoUrl }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") ?? searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  const { toggle: toggleSidebar } = useSidebarMobile();
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

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

  async function handleLogout() {
    setProfileOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(variant === "super_admin" ? "/super-admin1992/login" : "/company/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#F5F5F7] px-4 py-4 md:gap-6 md:px-8">
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-[#4D4D4D] transition hover:border-brand hover:text-brand md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="truncate text-xl font-bold text-black md:text-2xl">
        {title}
      </h1>

      <form
        onSubmit={submitSearch}
        className="relative mx-auto hidden max-w-[385px] flex-1 md:block"
      >
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-black/10 bg-white pl-10 pr-10 text-sm text-black outline-none transition placeholder:text-black/40 focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#F5F5F7] text-[11px] font-semibold text-[#505050]">
          S
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative" ref={popRef}>
          <button
            type="button"
            onClick={() => setNotifsOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-black/[0.04]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-[#e74c3c] to-[#d43f2f] px-0.5 text-[9px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifsOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
                <p className="text-sm font-bold text-black">Notification</p>
                <button
                  type="button"
                  onClick={() => setNotifsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-black/[0.04]"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <p className="p-6 text-center text-sm font-semibold text-[#9ca3af]">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm font-semibold text-[#9ca3af]">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => {
                    const tone = getNotifTone(n.title, n.message);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 border-b border-black/[0.06] px-4 py-3 last:border-0",
                          !n.read && "bg-[#5E3EA1]/[0.03]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            tone.bg,
                          )}
                        >
                          <IconDocument className={cn("h-3.5 w-3 shrink-0", tone.color)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold leading-snug text-black">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                            {new Date(n.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 text-left transition"
          >
            {companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(companyLogoUrl)}
                alt={userName}
                className="h-9 w-9 shrink-0 rounded-full border border-black/10 object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                {initials || "U"}
              </span>
            )}
            <span className="hidden md:block max-w-[140px]">
              <span className="block truncate text-sm font-semibold leading-4 text-black">
                {userName}
              </span>
              <span className="block truncate text-[11px] leading-4 text-[#4D4D4D]">
                {userRole}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-black/50 md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
              <Link
                href={
                  variant === "super_admin" ? "/super-admin1992/settings" : "/company/profile"
                }
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
              >
                <User className="h-4 w-4" />
                View Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#C00F0C] transition hover:bg-black/[0.04]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
