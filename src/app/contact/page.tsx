import { Suspense } from "react";
import { SiteNav } from "@/components/homepage/site-nav";
import { SiteFooter } from "@/components/homepage/site-footer";
import { ContactForm, ContactSupportCard } from "@/components/homepage/contact-form";
import { MKT_HERO_TITLE_CLASS, MKT_SUBTITLE_CLASS } from "@/components/homepage/section-heading";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Contact Us — Rono",
  description: "Get in touch with the Rono team for product inquiries, support, or partnerships.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="mkt-container py-[clamp(2rem,5vw,4rem)]">
        <h1 className={MKT_HERO_TITLE_CLASS}>Contact Us</h1>
        <p className={cn("mt-[clamp(0.75rem,2vw,1.5rem)] max-w-[49.75rem]", MKT_SUBTITLE_CLASS)}>
          Connect with our team for product inquiries, service support, or partnership
          opportunities. We&apos;re committed to providing prompt and reliable assistance.
        </p>

        <div className="mt-[clamp(1.5rem,4vw,2.5rem)] grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[1fr_1.2fr]">
          <ContactSupportCard />
          <Suspense fallback={<div className="h-[480px] rounded-2xl bg-[#F5F5F7]" />}>
            <ContactForm />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
