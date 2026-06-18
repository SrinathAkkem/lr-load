"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RonoLogo } from "@/components/rono/brand";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  BarChart3,
  Settings,
  ClipboardList,
  GitBranch,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const superAdminNav: NavItem[] = [
  { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { title: "Companies", href: "/super-admin/companies", icon: Building2 },
];

const companyAdminNav: NavItem[] = [
  { title: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard },
  { title: "LR Management", href: "/company/lr", icon: FileText, badge: 12 },
  { title: "Branch Management", href: "/company/branches", icon: GitBranch },
  { title: "Driver Management", href: "/company/drivers", icon: Users },
  { title: "Reports", href: "/company/reports", icon: BarChart3 },
  { title: "Company Profile", href: "/company/profile", icon: Settings },
];

export function PortalSidebar({
  variant,
  userName,
  userRole,
  companyName,
}: {
  variant: "super_admin" | "company_admin";
  userName: string;
  userRole: string;
  companyName?: string;
}) {
  const pathname = usePathname();
  const nav = variant === "super_admin" ? superAdminNav : companyAdminNav;

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-violet-900 to-indigo-950 text-white">
      <div className="border-b border-white/10 p-5">
        <RonoLogo className="text-white [&_span]:text-white" />
        {companyName && (
          <div className="mt-4 rounded-xl bg-white/10 p-3">
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-xs text-violet-200">COMPANY ADMIN</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-violet-300">
          Main Menu
        </p>
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-violet-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-sm font-bold">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-violet-300">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
