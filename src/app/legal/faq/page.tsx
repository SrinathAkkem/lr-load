import { LegalPageHeader } from "@/components/rono/legal-page-header";

export const metadata = {
  title: "FAQ — RonoHub",
  description: "Frequently asked questions about the RonoHub platform.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I get access to RonoHub?",
    a: "Companies are onboarded by a RonoHub Super Admin. Once your company is provisioned, your company admin can invite executives, and everyone signs in with the mobile number registered on their account via a one-time OTP — no passwords to remember.",
  },
  {
    q: "I'm getting \"mobile number not registered\" — what do I do?",
    a: "Double-check you're entering the exact 10-digit mobile number your company admin registered for you (no spaces or +91 prefix needed — we add that automatically). If the issue persists, ask your company admin to confirm the number on your executive profile, or contact support.",
  },
  {
    q: "Can I edit an LR after it has been submitted?",
    a: "You can edit an LR while it is still Pending. Once it has been Approved, moved to In Transit, or Delivered, it is locked for editing to preserve an accurate audit trail. If a correction is needed after approval, contact your company admin.",
  },
  {
    q: "How do I verify that an LR PDF is genuine?",
    a: "Every LR PDF includes a unique QR code in the footer. Scanning it opens a public verification page showing the LR number, status, and key shipment details as recorded on RonoHub — so any recipient can confirm it wasn't altered.",
  },
  {
    q: "Can I attach photos of the goods to an LR?",
    a: "Yes — while creating an LR you can attach up to five goods photos. They're included on a dedicated page of the generated LR PDF.",
  },
  {
    q: "Does RonoHub work well on a slow mobile connection?",
    a: "Yes. The app caches recent dashboard and LR data locally and only refetches when you explicitly pull to refresh, so navigating between screens stays fast even on patchy networks.",
  },
  {
    q: "Who can see my company's data?",
    a: "Only users within your company (based on their role) and RonoHub platform administrators for support and billing purposes. Data is never shared with, or sold to, third parties. See our Privacy Policy for details.",
  },
  {
    q: "How do I request a data export or account deletion?",
    a: "Email support@ronohub.com from your registered email or mobile number. See the Delete Account page for the full process and expected turnaround time.",
  },
];

export default function FaqPage() {
  return (
    <article className="py-6">
      <LegalPageHeader
        title="Frequently Asked Questions"
        subtitle="Answers to the things people ask us most."
      />

      <div className="mt-8 divide-y divide-[var(--brand-border)]">
        {FAQS.map((item) => (
          <div key={item.q} className="py-5">
            <h2 className="text-sm font-bold text-[var(--brand-text)]">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--brand-text-secondary)]">
              {item.a}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-[var(--brand-text-muted)]">
        Can&apos;t find what you&apos;re looking for?{" "}
        <a href="/legal/contact" className="font-semibold text-brand hover:underline">
          Get in touch with our team
        </a>
        .
      </p>
    </article>
  );
}
