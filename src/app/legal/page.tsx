import { RonoLogo } from "@/components/rono/brand";
import { StickyFooter } from "@/components/rono/sticky-footer";

export const metadata = {
  title: "About & Legal — RonoHub",
  description:
    "About Us, FAQ, Contact, Privacy Policy, Terms of Service, and Account Deletion information for RonoHub.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-[var(--brand-border)] py-12">
      <h2 className="text-2xl font-extrabold text-[var(--brand-text)]">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-3 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="border-b border-[var(--brand-border)] px-6 py-6 sm:px-10">
        <RonoLogo />
      </header>

      <main className="mx-auto max-w-3xl px-6 sm:px-10">
        <Section id="about" title="About Us">
          <p>
            RonoHub is a digital Lorry Receipt (LR) platform built for transport
            companies of every size. We help operators create, approve, and
            share LRs as QR-verified PDFs — replacing paper trails with a fast,
            auditable, mobile-first workflow.
          </p>
          <p>Powered by Rayudu Group.</p>
        </Section>

        <Section id="faq" title="FAQ">
          <div>
            <p className="font-bold text-[var(--brand-text)]">
              How do I get access to RonoHub?
            </p>
            <p>
              Companies are onboarded by a RonoHub administrator. Once your
              company is set up, sign in with the mobile number registered by
              your admin.
            </p>
          </div>
          <div>
            <p className="font-bold text-[var(--brand-text)]">
              Can I verify an LR shared with me?
            </p>
            <p>
              Yes — every LR includes a QR code that links to a public
              verification page confirming its authenticity.
            </p>
          </div>
          <div>
            <p className="font-bold text-[var(--brand-text)]">
              Is my data secure?
            </p>
            <p>
              All access is protected by OTP-based authentication and every
              action is logged for audit purposes.
            </p>
          </div>
        </Section>

        <Section id="contact" title="Contact">
          <p>Have a question or need support? Reach out to us:</p>
          <p>
            Email:{" "}
            <a href="mailto:support@ronohub.com" className="font-semibold text-brand hover:underline">
              support@ronohub.com
            </a>
          </p>
        </Section>

        <Section id="privacy" title="Privacy Policy">
          <p>
            We collect only the information required to operate the LR
            platform — company details, executive contact information, and LR
            transaction data. This information is never sold to third
            parties and is used solely to provide and improve the service.
          </p>
          <p>
            Data is stored securely and access is restricted to authorised
            personnel of your organisation. You may request a copy of your
            data or its deletion at any time by contacting support.
          </p>
        </Section>

        <Section id="terms" title="Terms of Service">
          <p>
            By using RonoHub, you agree to use the platform only for lawful
            transport documentation purposes. Companies are responsible for
            the accuracy of the information they submit through the
            platform.
          </p>
          <p>
            RonoHub is provided on an &quot;as-is&quot; basis. We strive for high
            availability but do not guarantee uninterrupted service.
          </p>
        </Section>

        <Section id="delete-account" title="Delete Account">
          <p>
            You can request permanent deletion of your RonoHub account and
            associated personal data at any time.
          </p>
          <p>
            To request deletion, email{" "}
            <a href="mailto:support@ronohub.com?subject=Account%20Deletion%20Request" className="font-semibold text-brand hover:underline">
              support@ronohub.com
            </a>{" "}
            from your registered mobile number/email with the subject
            &quot;Account Deletion Request&quot;. We will process your request and
            confirm once your account and personal data have been removed,
            typically within 7 business days.
          </p>
          <p>
            Note: LR records tied to a company&apos;s transport operations may be
            retained as required by law even after an individual user account
            is deleted.
          </p>
        </Section>
      </main>

      <StickyFooter />
    </div>
  );
}
