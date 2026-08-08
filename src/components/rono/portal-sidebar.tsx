"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users, Settings, ScrollText, X } from "lucide-react";
import {
  IconDashboardFilled,
  IconDocument,
  IconBuilding,
  IconUserGroup,
  IconAnalytics,
  IconCreditCard,
  IconProfile,
} from "@/components/rono/dashboard-icons";
import { useSidebarMobile } from "@/components/rono/sidebar-context";

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
      { title: "All Executives", href: "/super-admin/executives", icon: Users },
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
      { title: "Dashboard", href: "/company/dashboard", icon: IconDashboardFilled },
      { title: "LR Management", href: "/company/lr", icon: IconDocument, badgeKey: "pendingLrs" },
      { title: "Branch Management", href: "/company/branches", icon: IconBuilding },
      { title: "Executive Management", href: "/company/executives", icon: IconUserGroup },
      { title: "Reports", href: "/company/reports", icon: IconAnalytics },
      { title: "Profile", href: "/company/profile", icon: IconProfile },
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
  companyLogoUrl?: string | null;
  badges?: SidebarBadges;
}

export function PortalSidebar({
  variant,
  userName,
  userRole,
  companyName,
  companyCode,
  companyLogoUrl,
  badges,
}: SidebarProps) {
  const pathname = usePathname();
  const groups = variant === "super_admin" ? superAdminNav : companyAdminNav;
  const { open: mobileOpen, setOpen: setMobileOpen } = useSidebarMobile();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile backdrop - only rendered/visible when the drawer is open on small screens */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] shrink-0 flex-col overflow-hidden bg-white text-[#1E1E1E] transition-transform duration-300 ease-in-out",
          "md:sticky md:top-0 md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      {/* Logo */}
      <div className="relative z-10 flex items-center px-5 py-5 border-b border-black/[0.06]">
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#4D4D4D] transition hover:bg-black/5 md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <Link
          href={variant === "super_admin" ? "/super-admin/dashboard" : "/company/dashboard"}
          className="inline-flex items-center gap-2"
        >
          <Image src="/rono-logo.svg" alt="RonoHub" width={120} height={20} className="h-5 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
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
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-[#5E3EA1] text-white shadow-sm"
                      : "text-[#4D4D4D] hover:bg-black/[0.04] hover:text-[#1E1E1E]",
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-[#4D4D4D]")} />
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

      {/* Billing & Plans card */}
      {variant === "company_admin" && (
        <div className="relative z-10 px-3 pb-3">
          <Link
            href="/company/billing"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl bg-[#EFECF6] px-3.5 py-3 text-sm font-semibold text-[#553891] transition hover:bg-[#E9E3F7]"
          >
            <IconCreditCard className="h-[15px] w-[17px] shrink-0" />
            Billing &amp; Plans
          </Link>
        </div>
      )}

      </aside>
    </>
  );
}
