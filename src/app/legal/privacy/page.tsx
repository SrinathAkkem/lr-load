import { LegalPageHeader } from "@/components/rono/legal-page-header";

export const metadata = {
  title: "Privacy Policy — RonoHub",
  description: "How RonoHub collects, uses, and protects your data.",
};

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5">
      <h2 className="text-sm font-extrabold text-[var(--brand-text)]">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <article className="py-6">
      <LegalPageHeader
        title="Privacy Policy"
        subtitle="Last updated: August 2026"
      />

      <p className="mt-6 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        This Privacy Policy explains how Rayudu Group (&quot;RonoHub&quot;, &quot;we&quot;,
        &quot;us&quot;) collects, uses, discloses, and safeguards information when you use
        our web and mobile applications (the &quot;Service&quot;).
      </p>

      <div className="mt-4 divide-y divide-[var(--brand-border)]">
        <Clause title="1. Information We Collect">
          <p>
            <span className="font-bold text-[var(--brand-text)]">Account data:</span>{" "}
            name, mobile number, email, and role (super admin, company admin, or
            executive) provided when your account is created.
          </p>
          <p>
            <span className="font-bold text-[var(--brand-text)]">Company data:</span>{" "}
            company name, GSTIN/CIN, address, logo, and stamp uploaded by a company
            admin.
          </p>
          <p>
            <span className="font-bold text-[var(--brand-text)]">Transaction data:</span>{" "}
            Lorry Receipt details you create — consignor/consignee information, goods,
            weight, freight amount, signatures, and goods photographs.
          </p>
          <p>
            <span className="font-bold text-[var(--brand-text)]">Usage data:</span>{" "}
            login timestamps and audit trail entries required to keep the platform
            secure and accountable.
          </p>
        </Clause>

        <Clause title="2. How We Use Your Information">
          <ul className="list-disc space-y-1 pl-5">
            <li>To authenticate you and operate your account (OTP delivery, sessions).</li>
            <li>To generate, store, and verify Lorry Receipts and their QR codes.</li>
            <li>To compute dashboards, reports, and usage limits for your company.</li>
            <li>To provide customer support and respond to your requests.</li>
            <li>To detect, investigate, and prevent fraud, abuse, or security incidents.</li>
          </ul>
        </Clause>

        <Clause title="3. Data Sharing">
          <p>
            We do not sell your personal data. Information is shared only: within your
            own company (based on role — executives, company admins, and, where
            applicable, super admins); with service providers who host our
            infrastructure and deliver OTP SMS strictly to operate the Service; or when
            required to comply with a legal obligation.
          </p>
        </Clause>

        <Clause title="4. Data Retention">
          <p>
            Lorry Receipt records are retained for the duration required by applicable
            transport and tax regulations, even if an individual user account is later
            deleted, since they form part of your company&apos;s business records.
            Account data is retained only as long as the account remains active or as
            needed to comply with legal obligations.
          </p>
        </Clause>

        <Clause title="5. Data Security">
          <p>
            Access to the Service requires OTP-based or credential-based authentication.
            Uploaded images are validated and normalised server-side, sessions are
            scoped by role, and all administrative actions are recorded in an audit log.
            No method of transmission or storage is 100% secure, but we work to protect
            your information using industry-standard practices.
          </p>
        </Clause>

        <Clause title="6. Your Rights">
          <p>
            You may request access to, correction of, or deletion of your personal data
            by contacting <a href="mailto:support@ronohub.com" className="font-semibold text-brand hover:underline">support@ronohub.com</a>.
            See our{" "}
            <a href="/legal/delete-account" className="font-semibold text-brand hover:underline">
              Delete Account
            </a>{" "}
            page for the account-deletion process.
          </p>
        </Clause>

        <Clause title="7. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Material changes will
            be reflected by updating the &quot;Last updated&quot; date above.
          </p>
        </Clause>

        <Clause title="8. Contact">
          <p>
            Questions about this policy can be sent to{" "}
            <a href="mailto:support@ronohub.com" className="font-semibold text-brand hover:underline">
              support@ronohub.com
            </a>
            .
          </p>
        </Clause>
      </div>
    </article>
  );
}
