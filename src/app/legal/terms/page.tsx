import { LegalPageHeader } from "@/components/rono/legal-page-header";

export const metadata = {
  title: "Terms of Service — RonoHub",
  description: "The terms that govern your use of the RonoHub platform.",
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

export default function TermsPage() {
  return (
    <article className="py-6">
      <LegalPageHeader title="Terms of Service" subtitle="Last updated: August 2026" />

      <p className="mt-6 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of
        RonoHub, operated by Rayudu Group. By creating an account or otherwise using the
        Service, you agree to be bound by these Terms.
      </p>

      <div className="mt-4 divide-y divide-[var(--brand-border)]">
        <Clause title="1. Eligibility & Accounts">
          <p>
            Accounts are provisioned by a RonoHub Super Admin or a Company Admin within
            your organisation. You are responsible for keeping your login credentials
            (mobile number / OTP, or email and password) confidential and for all
            activity that occurs under your account.
          </p>
        </Clause>

        <Clause title="2. Acceptable Use">
          <p>
            You agree to use the Service only for lawful transport documentation
            purposes and to submit accurate information in every Lorry Receipt. You must
            not attempt to circumvent access controls, tamper with QR verification, or
            use the Service to store or transmit unlawful content.
          </p>
        </Clause>

        <Clause title="3. Your Content">
          <p>
            You retain ownership of the company, LR, and image data you submit. By
            uploading it, you grant Rayudu Group a licence to host, process, and display
            that data as needed to operate the Service (for example, generating LR PDFs
            and QR verification pages).
          </p>
        </Clause>

        <Clause title="4. Subscriptions & Limits">
          <p>
            Company accounts may be subject to usage limits (such as maximum LRs per
            month or maximum branches) as configured by RonoHub. Continued use above a
            plan&apos;s limits may require an upgraded plan.
          </p>
        </Clause>

        <Clause title="5. Availability">
          <p>
            We aim for high availability but provide the Service on an
            &quot;as-is&quot; and &quot;as-available&quot; basis, without warranties of
            any kind, express or implied. Scheduled maintenance or unforeseen outages may
            temporarily interrupt access.
          </p>
        </Clause>

        <Clause title="6. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Rayudu Group shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of,
            or inability to use, the Service, including disputes arising from the
            accuracy of information entered by users into Lorry Receipts.
          </p>
        </Clause>

        <Clause title="7. Termination">
          <p>
            We may suspend or terminate access to the Service for any account that
            violates these Terms or applicable law. You or your company admin may
            request account deactivation at any time — see our{" "}
            <a href="/legal/delete-account" className="font-semibold text-brand hover:underline">
              Delete Account
            </a>{" "}
            page.
          </p>
        </Clause>

        <Clause title="8. Governing Law">
          <p>
            These Terms are governed by the laws of India, and any disputes shall be
            subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.
          </p>
        </Clause>

        <Clause title="9. Changes to These Terms">
          <p>
            We may revise these Terms from time to time. Continued use of the Service
            after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Clause>

        <Clause title="10. Contact">
          <p>
            Questions about these Terms can be sent to{" "}
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
