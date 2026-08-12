import { PortalSidebar } from "@/components/rono/portal-sidebar";
import { PortalTopbar } from "@/components/rono/portal-topbar";
import { SidebarMobileProvider } from "@/components/rono/sidebar-context";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SuperAdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/super-admin1992/login");
  }

  return (
    <SidebarMobileProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <PortalSidebar
          variant="super_admin"
          userName={session.name}
          userRole="Super Admin"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar
            variant="super_admin"
            userName={session.name}
            userRole="Super Admin"
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarMobileProvider>
  );
}
