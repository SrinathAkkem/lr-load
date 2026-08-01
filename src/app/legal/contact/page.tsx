import { LegalPageHeader } from "@/components/rono/legal-page-header";
import { Mail, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Contact — RonoHub",
  description: "Get in touch with the RonoHub support team.",
};

export default function ContactPage() {
  return (
    <article className="py-6">
      <LegalPageHeader
        title="Contact Us"
        subtitle="We usually respond within one business day."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <div className="rounded-lg bg-white p-2">
            <Mail className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Support Email
            </p>
            <a
              href="mailto:support@ronohub.com"
              className="mt-1 block text-sm font-bold text-[var(--brand-text)] hover:text-brand"
            >
              support@ronohub.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
          <div className="rounded-lg bg-white p-2">
            <Clock className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Support Hours
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
              Mon – Sat, 9:30 AM – 6:30 PM IST
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 sm:col-span-2">
          <div className="rounded-lg bg-white p-2">
            <MapPin className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-text-muted)]">
              Operated By
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--brand-text)]">
              Rayudu Group — RonoHub
            </p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Hyderabad, Telangana, India
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
        For account-specific issues (login problems, missing LRs, incorrect company
        details), please email us from the address or mobile number registered on your
        RonoHub account so we can verify and resolve your request faster.
      </div>
    </article>
  );
}
