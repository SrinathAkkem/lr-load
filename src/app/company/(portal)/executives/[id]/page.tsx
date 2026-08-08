import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { toLR, toBranch, toSavedAddress } from "@/lib/db/serialize";
import { ExecutiveDetailClient } from "./executive-detail-client";

export const dynamic = "force-dynamic";

export default async function ExecutiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getSession();
  if (!session?.companyId || session.role !== "company_admin") {
    redirect("/company/login");
  }

  const { id } = await params;
  const { edit } = await searchParams;

  const executive = await prisma.user.findUnique({
    where: { id },
    include: { branch: true },
  });

  if (!executive || executive.role !== "executive" || executive.companyId !== session.companyId) {
    notFound();
  }

  const [lrs, addresses, branches] = await Promise.all([
    prisma.lRRequest.findMany({
      where: { executiveId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedAddress.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedLrs = lrs.map(toLR);
  const stats = {
    total: serializedLrs.length,
    approved: serializedLrs.filter((l) => ["approved", "in_transit", "delivered"].includes(l.status)).length,
    pending: serializedLrs.filter((l) => l.status === "pending").length,
    rejected: serializedLrs.filter((l) => l.status === "rejected").length,
  };

  return (
    <ExecutiveDetailClient
      executive={{
        id: executive.id,
        name: executive.name,
        mobile: executive.mobile,
        status: executive.status,
        createdAt: executive.createdAt.toISOString(),
        branch: executive.branch ? toBranch(executive.branch) : null,
      }}
      stats={stats}
      lrs={serializedLrs}
      addresses={addresses.map(toSavedAddress)}
      branches={branches.map(toBranch)}
      initialEdit={edit === "1"}
    />
  );
}
