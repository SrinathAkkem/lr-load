"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RonoLogo } from "@/components/rono/brand";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  BarChart3,
  Settings,
  GitBranch,
  ScrollText,
  UserCircle2,
  LogOut,
  ChevronRight,
  CreditCard,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "pendingLrs";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const superAdminNav: NavGroup[] = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
      { title: "Companies", href: "/super-admin/companies", icon: Building2 },
      { title: "All Drivers", href: "/super-admin/drivers", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/super-admin/settings", icon: Settings },
      { title: "Audit Log", href: "/super-admin/audit", icon: ScrollText },
    ],
  },
];

const companyAdminNav: NavGroup[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
      { title: "LR Management", href: "/company/lr", icon: FileText, badgeKey: "pendingLrs" },
      { title: "Branch Management", href: "/company/branches", icon: GitBranch },
      { title: "Driver Management", href: "/company/drivers", icon: Users },
      { title: "Reports", href: "/company/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Company",
    items: [
      { title: "Billing & Plans", href: "/company/billing", icon: CreditCard },
      { title: "Company Profile", href: "/company/profile", icon: Settings },
    ],
  },
];

interface SidebarBadges {
  pendingLrs?: number;
}

interface SidebarProps {
  variant: "super_admin" | "company_admin";
  userName: string;
  userRole: string;
  companyName?: string;
  companyCode?: string;
  badges?: SidebarBadges;
}

export function PortalSidebar({
  variant,
  userName,
  userRole,
  companyName,
  companyCode,
  badges,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const groups = variant === "super_admin" ? superAdminNav : companyAdminNav;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-sidebar-user]") == null) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      const target =
        variant === "super_admin" ? "/super-admin/login" : "/company/login";
      router.push(target);
      router.refresh();
    }
  }

  const isActive = (href: string) => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="relative sticky top-0 flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-[#2d2d4e]/20 bg-gradient-to-br from-[#5a3dc8] via-[#4a2fb8] to-[#3a1fa0] text-white">
      {/* Decorative circles */}
      <div className="absolute -right-8 top-20 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -left-8 bottom-32 h-24 w-24 rounded-full bg-white/5" />
      {/* Logo + Platform Box */}
      <div className="relative z-10 p-5 pb-4">
        <Link href={variant === "super_admin" ? "/super-admin/dashboard" : "/company/dashboard"}>
          <RonoLogo className="text-white [&_span]:text-white" />
        </Link>

        {variant === "super_admin" ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[13px] font-bold text-white">RonoHub Platform</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Super Admin
            </p>
          </div>
        ) : companyName ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="truncate text-[13px] font-bold text-white" title={companyName}>
              {companyName}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Company Admin{companyCode ? ` · ${companyCode}` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const badgeValue =
                item.badgeKey && badges?.[item.badgeKey]
                  ? badges[item.badgeKey]
                  : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-[#7b4fd4] to-[#3b9fe8] text-white shadow-md"
                      : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-white to-white/80" />
                  )}
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-white/50")} />
                  <span className="flex-1 truncate">{item.title}</span>
                  {badgeValue ? (
                    <span className="rounded-full bg-[#f5a623] px-2 py-0.5 text-[10px] font-bold text-white">
                      {badgeValue}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="relative z-10 border-t border-white/10 p-3" data-sidebar-user>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.08]"
        >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7b4fd4] to-[#3b9fe8] text-xs font-bold text-white shadow-md">
                {initials || "U"}
              </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">{userName}</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
              {userRole}
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-white/50 transition-transform",
              menuOpen && "rotate-90",
            )}
          />
        </button>

        {menuOpen && (
          <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
            {variant === "company_admin" && (
              <Link
                href="/company/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-white transition hover:bg-white/10"
              >
                <UserCircle2 className="h-4 w-4" />
                Company Profile
              </Link>
            )}
            {variant === "super_admin" && (
              <Link
                href="/super-admin/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-white transition hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-[#e74c3c] transition hover:bg-white/10 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
