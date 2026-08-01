import { LegalPageHeader } from "@/components/rono/legal-page-header";
import { Mail, ShieldAlert, Clock3 } from "lucide-react";

export const metadata = {
  title: "Delete Account — RonoHub",
  description: "How to request deletion of your RonoHub account and personal data.",
};

export default function DeleteAccountPage() {
  return (
    <article className="py-6">
      <LegalPageHeader
        title="Delete Account"
        subtitle="Request permanent deletion of your RonoHub account and personal data."
      />

      <div className="mt-8 space-y-3 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        <p>
          You can request deletion of your RonoHub account at any time. Once processed,
          your login credentials, profile information, and personal data will be
          permanently removed from our active systems.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex gap-4 rounded-xl border border-[var(--brand-border)] p-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            1
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--brand-text)]">Send a request</p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Email{" "}
              <a
                href="mailto:support@ronohub.com?subject=Account%20Deletion%20Request"
                className="font-semibold text-brand hover:underline"
              >
                support@ronohub.com
              </a>{" "}
              from your registered email or mobile number, with the subject line{" "}
              <span className="font-semibold text-[var(--brand-text)]">
                &quot;Account Deletion Request&quot;
              </span>
              . Include your registered mobile number and company name so we can
              locate your account.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-xl border border-[var(--brand-border)] p-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            2
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--brand-text)]">We verify ownership</p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Our support team confirms the request came from the account owner (or an
              authorised company admin, for executive accounts) before proceeding.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-xl border border-[var(--brand-border)] p-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            3
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--brand-text)]">
              Account and data removed
            </p>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              We permanently delete your profile, login credentials, and personal data,
              and confirm completion by email — typically within 7 business days.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs leading-relaxed text-[var(--brand-text-secondary)]">
            Processing typically takes up to <span className="font-bold">7 business days</span>{" "}
            from the day we verify your request.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="text-xs leading-relaxed text-[var(--brand-text-secondary)]">
            Lorry Receipt records tied to your company&apos;s transport operations may be
            retained where required by tax or transport regulation, even after your
            individual account is deleted.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-800">
        <Mail className="h-4 w-4 shrink-0" />
        Need help? Reach us any time at{" "}
        <a href="mailto:support@ronohub.com" className="font-bold hover:underline">
          support@ronohub.com
        </a>
      </div>
    </article>
  );
}
