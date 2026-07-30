"use client";

import { useEffect, useState } from "react";
import { RonoLogo } from "@/components/rono/brand";
import { formatINR } from "@/components/rono/status-badge";
import { Shield, Download, Truck, Package, MapPin, FileText } from "lucide-react";

type QRData = {
  lrNumber: string;
  company: { name: string; logoUrl?: string | null; gstNumber: string } | null;
  consignorName: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  goodsDescription: string;
  noOfPackages: number;
  weightKg: number;
  freightAmount: number;
  paymentMode: string;
  vehicleNumber: string;
  dispatchDate: string;
  originCity: string;
  destinationCity: string;
  status: string;
  pdfUrl?: string;
};

const STATUS_TONE: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function QRLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    params.then(async (p) => {
      try {
        const res = await fetch(`/api/qr/${p.code}`);
        const d = await res.json();
        if (!cancelled && d.success) setData(d.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="mt-3 text-sm text-slate-500">Loading LR details…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
          <Shield className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">
            QR not recognised
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This receipt code is invalid or has been removed by the carrier.
          </p>
        </div>
      </div>
    );
  }

  const statusLabel =
    data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase();
  const statusClass = STATUS_TONE[statusLabel] ?? STATUS_TONE.Pending;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-12">
      <header className="border-b bg-white px-5 py-5">
        <div className="flex items-start gap-3">
          {data.company?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.company.logoUrl}
              alt={data.company.name}
              className="h-12 w-12 rounded-xl border border-slate-200 object-contain bg-white"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Truck className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">
              {data.company?.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              GSTIN {data.company?.gstNumber}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/15">
              <Shield className="h-3 w-3" /> Verified Lorry Receipt
            </p>
          </div>
        </div>
      </header>

      <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] via-[var(--brand-primary-light)] to-[var(--brand-gradient-end)] p-5 text-white shadow-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          Lorry Receipt Number
        </p>
        <p className="mt-1 text-2xl font-bold">{data.lrNumber}</p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-white/80">Dispatched {data.dispatchDate}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 backdrop-blur ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <Section title="Route" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <RouteEnd label="From" value={data.originCity} />
          <RouteEnd label="To" value={data.destinationCity} />
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
          <p className="font-semibold text-slate-700">Vehicle</p>
          <p className="mt-0.5 font-mono text-base font-bold text-primary">
            {data.vehicleNumber}
          </p>
        </div>
      </Section>

      <Section title="Parties">
        <div className="grid grid-cols-1 gap-3">
          <Party label="Consignor" name={data.consignorName} address={data.consignorAddress} />
          <Party label="Consignee" name={data.consigneeName} address={data.consigneeAddress} />
        </div>
      </Section>

      <Section title="Goods" icon={<Package className="h-4 w-4" />}>
        <p className="font-semibold text-slate-900">{data.goodsDescription}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Cell label="Packages" value={`${data.noOfPackages}`} />
          <Cell label="Weight" value={`${data.weightKg} kg`} />
          <Cell label="Mode" value={data.paymentMode} />
        </div>
      </Section>

      <Section title="Freight">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-primary">
            {formatINR(data.freightAmount)}
          </p>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            {data.paymentMode}
          </span>
        </div>
      </Section>

      {data.pdfUrl && (
        <a
          href={data.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-4 mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] py-4 font-bold text-white shadow-lg shadow-brand transition active:scale-[0.99]"
        >
          <Download className="h-5 w-5" /> Download LR PDF
        </a>
      )}

      <footer className="mt-10 px-4 text-center">
        <RonoLogo className="justify-center" />
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
          <FileText className="h-3 w-3" /> Empowered by Rayudu Group · RonoHub
        </p>
      </footer>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-4 mt-3 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
        {icon} {title}
      </h2>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function RouteEnd({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Party({
  label,
  name,
  address,
}: {
  label: string;
  name: string;
  address: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{name}</p>
      <p className="mt-0.5 text-xs text-slate-500">{address}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
