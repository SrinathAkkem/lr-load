import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";
import { formatDate, formatINR, LR_STATUS_PILL } from "@/components/rono/status-badge";
import { ApproveRejectActions } from "./actions";
import { mediaUrl } from "@/lib/media-url";
import {
  ChevronLeft,
  Download,
  Building2,
  MapPin,
  Phone,
  Package,
  Truck,
  Calendar,
  Check,
} from "lucide-react";
export const dynamic = "force-dynamic";

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
    <div className="p-4 md:p-8">
      <Link
        href="/company/lr"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#4D4D4D] hover:text-black"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to LR Management
      </Link>
      <h1 className="mt-1 text-xl font-bold text-black">LR Detail</h1>

      {/* Header card */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2EFFA] text-[#5E3EA1]">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-[#9CA3AF]">LR Number</p>
            <p className="text-lg font-bold text-[#0C6B24]">{lr.lrNumber ?? lr.trackingId}</p>
            <p className="text-[11px] text-[#9CA3AF]">Submitted on : {formatDate(lr.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${LR_STATUS_PILL[lr.status]}`}>
            {lr.status}
          </span>
          {lr.status !== "pending" && (
            <a
              href={`/api/lr/${lr.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5E3EA1] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      {lr.status === "rejected" && lr.rejectionReason && (
        <div className="mt-4 rounded-xl border border-[#961C1C]/20 bg-[#961C1C]/5 p-4 text-sm text-[#961C1C]">
          <p className="font-semibold">Rejected</p>
          <p className="mt-1">{lr.rejectionReason}</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card icon={<Truck className="h-4 w-4" />} title="Consignor Detail">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field icon={<Building2 className="h-3.5 w-3.5" />} label="Consignor Name" value={lr.consignorName} />
              <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Consignor City" value={lr.originCity} valueClass="text-[#5E3EA1]" />
              <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone No." value="—" />
            </div>
            <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={lr.consignorAddress} className="mt-4" />
          </Card>

          <Card icon={<Truck className="h-4 w-4" />} title="Consignee Detail">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field icon={<Building2 className="h-3.5 w-3.5" />} label="Consignee Name" value={lr.consigneeName} />
              <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Consignee City" value={lr.destinationCity} valueClass="text-[#5E3EA1]" />
              <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone No." value={`+91 ${lr.consigneePhone}`} />
            </div>
            <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={lr.consigneeAddress} className="mt-4" />
          </Card>

          <Card icon={<Package className="h-4 w-4" />} title="Shipment Detail">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field icon={<Package className="h-3.5 w-3.5" />} label="Weight" value={`${lr.weightKg} KG`} />
              <Field icon={<span className="text-sm font-bold">₹</span>} label="Declared Value" value={formatINR(lr.declaredValue)} />
              <Field icon={<Truck className="h-3.5 w-3.5" />} label="Vehicle Number" value={lr.vehicleNumber} />
              <Field icon={<Calendar className="h-3.5 w-3.5" />} label="Dispatch Date" value={formatDate(lr.dispatchDate)} />
            </div>
            <Field icon={<Package className="h-3.5 w-3.5" />} label="Description" value={lr.goodsDescription} className="mt-4" />

            {lr.specialInstructions && (
              <div className="mt-4 rounded-xl border border-[#F7CE25]/40 bg-[#F7CE25]/10 p-3 text-sm text-[#967E1C]">
                <p className="font-semibold">Special Instructions</p>
                <p className="mt-1">{lr.specialInstructions}</p>
              </div>
            )}

            {lr.photos && lr.photos.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF]">
                  <Package className="h-3.5 w-3.5" /> Goods Photos ({lr.photos.length})
                </p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {lr.photos.map((url, i) => {
                    const src = mediaUrl(url);
                    if (!src) return null;
                    return (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg border border-black/[0.06] bg-[#F5F5F7]"
                      >
                        <Image
                          src={src}
                          alt={`Goods photo ${i + 1}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card icon={<Calendar className="h-4 w-4" />} title="Timeline">
            <Timeline lr={lr} />
          </Card>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0C6B24]/10 text-sm font-bold text-[#0C6B24]">
                ₹
              </span>
              <h3 className="text-sm font-bold text-black">Freight Amount</h3>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#0C6B24]">{formatINR(lr.freightAmount)}</p>

            <p className="mt-4 text-[11px] font-semibold text-[#9CA3AF]">Payment Mode</p>
            <p className="text-sm font-semibold text-[#5E3EA1]">{lr.paymentMode}</p>

            <p className="mt-4 text-[11px] font-semibold text-[#9CA3AF]">Submitted By</p>
            <p className="text-sm font-semibold text-[#5E3EA1]">
              {lrRow.executive.name} - {lrRow.branch.name}
            </p>

            {lr.signatureUrl && mediaUrl(lr.signatureUrl) && (
              <div className="mt-4 rounded-xl border border-black/[0.06] bg-[#FAFAFB] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(lr.signatureUrl)}
                  alt="Authorised signature"
                  className="mx-auto h-16 object-contain"
                />
                <p className="mt-1 text-center text-[11px] text-[#9CA3AF]">Signed By : {lrRow.executive.name}</p>
              </div>
            )}
          </div>

          {lr.status === "pending" && <ApproveRejectActions id={lr.id} />}
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2EFFA] text-[#5E3EA1]">
          {icon}
        </span>
        <h3 className="text-sm font-bold text-black">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  valueClass,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[#9CA3AF]">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-semibold text-black ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}

function Timeline({ lr }: { lr: ReturnType<typeof toLR> }) {
  const events = [
    { label: "LR Submitted", at: lr.createdAt, done: true },
    {
      label: lr.status === "rejected" ? "LR Rejected" : "LR Approval Pending",
      at: lr.approvedAt,
      done: !!lr.approvedAt || lr.status === "rejected",
    },
    {
      label: "Delivered",
      at: lr.deliveredAt,
      done: !!lr.deliveredAt,
    },
  ];

  return (
    <ol>
      {events.map((e, i) => (
        <li key={i} className="relative flex items-start gap-3 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px border-l border-dashed border-black/15" />
          )}
          <span
            className={`z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full ${
              e.done ? "bg-[#0C6B24]" : "bg-[#F5F5F7]"
            }`}
          >
            {e.done && <Check className="h-3 w-3 text-white" />}
          </span>
          <div>
            <p className={`text-sm font-semibold ${e.done ? "text-black" : "text-[#9CA3AF]"}`}>{e.label}</p>
            <p className="text-[11px] text-[#9CA3AF]">{e.at ? formatDate(e.at) : "Pending"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
