import { PortalSidebar } from "@/components/rono/portal-sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getCompanyById } from "@/lib/services/lr-service";

export default async function CompanyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "company_admin") {
    redirect("/company/login");
  }

  const company = session.companyId
    ? await getCompanyById(session.companyId)
    : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar
        variant="company_admin"
        userName={session.name}
        userRole="Company Admin"
        companyName={company?.name}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
