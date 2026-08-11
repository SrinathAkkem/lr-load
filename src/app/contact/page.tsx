import { Suspense } from "react";
import { SiteNav } from "@/components/homepage/site-nav";
import { SiteFooter } from "@/components/homepage/site-footer";
import { ContactForm, ContactSupportCard } from "@/components/homepage/contact-form";

export const metadata = {
  title: "Contact Us — Rono",
  description: "Get in touch with the Rono team for product inquiries, support, or partnerships.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
        <h1 className="shrink-0 text-[32px] font-semibold leading-tight sm:text-[44px] lg:text-[56px]">
          <span className="text-black">Contact Us</span>
        </h1>
        <p className="mt-6 max-w-[796px] text-lg text-[#4E4E4E] sm:text-xl lg:text-[26px]">
          Connect with our team for product inquiries, service support, or partnership
          opportunities. We&apos;re committed to providing prompt and reliable assistance.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
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
