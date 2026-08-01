import { LegalPageHeader } from "@/components/rono/legal-page-header";

export const metadata = {
  title: "About Us — RonoHub",
  description: "Learn about RonoHub, the digital Lorry Receipt platform by Rayudu Group.",
};

export default function AboutPage() {
  return (
    <article className="py-6">
      <LegalPageHeader
        title="About Us"
        subtitle="Digital Lorry Receipts, built for how transport actually runs."
      />

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        <p>
          RonoHub is a digital Lorry Receipt (LR) management platform built by{" "}
          <span className="font-bold text-[var(--brand-text)]">Rayudu Group</span> for
          transport companies, fleet operators, and logistics teams. We replace paper LR
          books with a fast, auditable, mobile-first workflow that field executives can
          use from a truck cab and admins can approve from a desk.
        </p>

        <div>
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">What we do</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Executives capture consignor/consignee details, goods, weight, and freight
              information directly from the mobile app at the point of dispatch.
            </li>
            <li>
              Company admins review and approve LRs, track fleet activity, and manage
              executives and branches from a single web dashboard.
            </li>
            <li>
              Every approved LR is issued as a tamper-evident, QR-verified PDF that can be
              shared with consignors, consignees, and auditors.
            </li>
            <li>
              Super Admins provision and oversee companies on the platform, including
              subscription limits and platform-wide audit logs.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">Why RonoHub</h2>
          <p className="mt-3">
            Paper LRs get lost, damaged, or disputed. RonoHub gives every shipment a
            single source of truth — timestamped, role-based, and instantly verifiable by
            anyone with the QR code — while keeping the workflow simple enough for a
            driver-facing executive to use in under a minute per LR.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
            Operated by
          </p>
          <p className="mt-1 font-bold text-[var(--brand-text)]">Rayudu Group</p>
          <p className="mt-1 text-[var(--brand-text-muted)]">
            Hyderabad, Telangana, India · support@ronohub.com
          </p>
        </div>
      </div>
    </article>
  );
}
