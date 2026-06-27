"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText, User, LayoutDashboard, Users } from "lucide-react";

export function MobileShell({
  children,
  title,
  subtitle,
  headerClassName,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerClassName?: string;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50">
      {(title || subtitle) && (
        <div className={cn("bg-gradient-to-b from-violet-700 to-violet-900 px-5 pb-6 pt-12 text-white", headerClassName)}>
          {title && <h1 className="text-xl font-bold">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-violet-200">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function DriverBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/mobile/executive/home", icon: Home, label: "Home" },
    { href: "/mobile/executive/lrs", icon: FileText, label: "My LRs" },
    { href: "/mobile/executive/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 border-t bg-white px-6 py-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-1 flex-col items-center gap-1 text-xs", active ? "text-violet-600" : "text-slate-400")}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/mobile/admin/home", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/mobile/admin/lrs", icon: FileText, label: "LRs" },
    { href: "/mobile/admin/drivers", icon: Users, label: "Drivers" },
    { href: "/mobile/admin/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 border-t bg-white px-4 py-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-1 flex-col items-center gap-1 text-[10px]", active ? "text-violet-600" : "text-slate-400")}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
