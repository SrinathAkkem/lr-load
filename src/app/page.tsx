import { Hero } from "@/components/homepage/hero";
import { LogoStrip } from "@/components/homepage/logo-strip";
import { CompareSection } from "@/components/homepage/compare-section";
import { StepsSection } from "@/components/homepage/steps-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { TestimonialsSection } from "@/components/homepage/testimonials-section";
import { FaqSection } from "@/components/homepage/faq-section";
import { FinalCta } from "@/components/homepage/final-cta";
import { SiteFooter } from "@/components/homepage/site-footer";

/**
 * The public marketing homepage — always shown at `/`, signed in or not.
 * Every CTA (nav "Login", hero "Start Free Trial", etc.) routes through
 * `LoginButton`, which sends an already-signed-in company admin straight to
 * their dashboard and everyone else (including a stray super-admin session,
 * which is deliberately signed out first) to the company login/register page.
 */
export default function HomePage() {
  return (
    <div className="bg-white">
      <Hero />
      <LogoStrip />
      <CompareSection />
      <StepsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
