import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";
import { StatusBadge, formatDate, formatINR } from "@/components/rono/status-badge";
import { ApproveRejectActions } from "./actions";
import { ChevronLeft, Download, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const PAYMENT_LABELS: Record<string, string> = {
  to_pay: "To Pay",
  paid: "Paid",
  tbb: "TBB",
};

export default async function CompanyLRDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.companyId || session.role !== "company_admin") {
    redirect("/company/login");
  }

  const lrRow = await prisma.lRRequest.findUnique({
    where: { id },
    include: { executive: true, branch: true, company: true },
  });
  if (!lrRow || lrRow.companyId !== session.companyId) notFound();

  const lr = toLR(lrRow);

  return (
    <div className="p-8">
      <Link
        href="/company/lr"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to LRs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Lorry Receipt
          </p>
          <h1 className="text-3xl font-bold">{lr.trackingId}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submitted {formatDate(lr.createdAt)} · Executive: {lrRow.executive.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={lr.status} />
          {lr.status !== "pending" && (
            <a
              href={`/api/lr/${lr.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </a>
          )}
          <a
            href={`/qr/${lrRow.qrCode}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            QR Tracking
          </a>
        </div>
      </div>

      {lr.status === "rejected" && lr.rejectionReason && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Rejected</p>
          <p className="mt-1">{lr.rejectionReason}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Consignor & Consignee">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Consignor
                </p>
                <p className="mt-2 font-semibold">{lr.consignorName}</p>
                <p className="mt-1 text-sm text-slate-500">{lr.consignorAddress}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Consignee
                </p>
                <p className="mt-2 font-semibold">{lr.consigneeName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {lr.consigneeAddress}
                </p>
                <p className="mt-1 text-sm font-medium">
                  +91 {lr.consigneePhone}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Goods & Movement">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Origin" value={lr.originCity} />
              <Field label="Destination" value={lr.destinationCity} />
              <Field label="Vehicle Number" value={lr.vehicleNumber} />
              <Field label="Dispatch Date" value={formatDate(lr.dispatchDate)} />
              <Field label="Goods" value={lr.goodsDescription} />
              <Field label="Packages" value={`${lr.noOfPackages}`} />
              <Field label="Weight" value={`${lr.weightKg} kg`} />
              <Field label="Declared Value" value={formatINR(lr.declaredValue)} />
            </div>
            {lr.specialInstructions && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">Special Instructions</p>
                <p className="mt-1">{lr.specialInstructions}</p>
              </div>
            )}
          </Card>

          <Card title="Freight">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Freight Amount" value={formatINR(lr.freightAmount)} />
              <Field
                label="Payment Mode"
                value={PAYMENT_LABELS[lr.paymentMode] ?? lr.paymentMode}
              />
            </div>
          </Card>

          {lr.photos && lr.photos.length > 0 && (
            <Card title={`Goods Photos (${lr.photos.length})`}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {lr.photos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-xl border bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`Goods photo ${i + 1}`}
                      fill
                      sizes="200px"
                      className="object-cover transition group-hover:scale-105"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {lr.signatureUrl && (
            <Card title="Authorised Signature">
              <div className="rounded-xl border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lr.signatureUrl}
                  alt="Authorised signature"
                  className="mx-auto h-32 object-contain"
                />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Executive">
            <p className="font-semibold">{lrRow.executive.name}</p>
            <p className="text-sm text-slate-500">+91 {lrRow.executive.mobile}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
              Branch
            </p>
            <p className="text-sm font-medium">
              {lrRow.branch.name} · {lrRow.branch.city}
            </p>
          </Card>

          <Card title="Timeline">
            <Timeline lr={lr} />
          </Card>

          {lr.status === "pending" && <ApproveRejectActions id={lr.id} />}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Timeline({ lr }: { lr: ReturnType<typeof toLR> }) {
  const events = [
    { label: "Submitted", at: lr.createdAt, done: true },
    {
      label: "Approved",
      at: lr.approvedAt,
      done: !!lr.approvedAt,
      tone: "emerald" as const,
    },
    {
      label: "Delivered",
      at: lr.deliveredAt,
      done: !!lr.deliveredAt,
      tone: "violet" as const,
    },
  ];

  return (
    <ol className="space-y-3">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              e.done ? "bg-violet-500" : "bg-slate-300"
            }`}
          />
          <div>
            <p className="text-sm font-semibold">{e.label}</p>
            <p className="text-xs text-slate-500">
              {e.at ? formatDate(e.at) : "Pending"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
