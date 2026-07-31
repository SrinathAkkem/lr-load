import { PortalSidebar } from "@/components/rono/portal-sidebar";
import { PortalTopbar } from "@/components/rono/portal-topbar";
import { SidebarMobileProvider } from "@/components/rono/sidebar-context";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getCompanyById } from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";

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

  // Live "pending LRs" badge for the sidebar — keeps the chip in sync with the
  // actual queue rather than a hardcoded number.
  const pendingLrs = session.companyId
    ? await prisma.lRRequest.count({
        where: { companyId: session.companyId, status: "pending" },
      })
    : 0;

  return (
    <SidebarMobileProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <PortalSidebar
          variant="company_admin"
          userName={session.name}
          userRole="Company Admin"
          companyName={company?.name}
          companyCode={company?.lrCode}
          companyLogoUrl={company?.logoUrl}
          badges={{ pendingLrs }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar
            variant="company_admin"
            userName={session.name}
            userRole={company?.name ?? "Company Admin"}
            companyLogoUrl={company?.logoUrl}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarMobileProvider>
  );
}
