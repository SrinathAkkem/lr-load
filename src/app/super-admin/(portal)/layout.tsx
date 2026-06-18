import { PortalSidebar } from "@/components/rono/portal-sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SuperAdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/super-admin/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar
        variant="super_admin"
        userName={session.name}
        userRole="Super Admin"
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
