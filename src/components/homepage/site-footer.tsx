import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

const RESOURCES = ["User Guide", "Guided Tour", "FAQ'S", "Quick Start Guide", "Community", "What's new"];
const QUICK_LINKS = ["Pricing", "Request Demo", "Customer Stories"];

export function SiteFooter() {
  return (
    <footer id="about" className="mt-[clamp(2rem,4vw,4rem)] bg-[#F5F5F5] pt-[clamp(2rem,4vw,3.5rem)]">
      <div className="mkt-container">
        <div className="grid min-w-0 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image src="/rono-logo.png" alt="Rono" width={130} height={34} className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#333333]">
              With a 10-year roadmap to achieve Level 5 maturity, RONO is on a mission to become a
              trusted global partner for businesses and individuals seeking digital
              transformation.
            </p>
            <NewsletterForm />
          </div>

          <div>
            <p className="text-sm font-bold text-[#333333]">Resources</p>
            <ul className="mt-4 space-y-3">
              {RESOURCES.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-[#333333] transition hover:text-black">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-[#333333]">Quick Links</p>
            <ul className="mt-4 space-y-3">
              {QUICK_LINKS.map((item) => (
                <li key={item}>
                  <a href={item === "Pricing" || item === "Request Demo" ? `/contact?subject=${item === "Pricing" ? "pricing" : "demo"}` : "#"} className="text-sm text-[#333333] transition hover:text-black">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm leading-relaxed text-[#333333]">
              6/5/1869, Srinagar Colony,
              <br />
              Kukatpally, Andhra Pradesh,
              <br />
              India, 500072.
            </p>
            <a
              href="mailto:contact@ronolabs.com"
              className="mt-4 flex items-center gap-2 text-sm text-[#333333] transition hover:text-black"
            >
              <Mail className="h-4 w-4" /> contact@ronolabs.com
            </a>
            <a
              href="tel:04040281333"
              className="mt-2 flex items-center gap-2 text-sm text-[#333333] transition hover:text-black"
            >
              <Phone className="h-4 w-4" /> 040-40281333
            </a>
            <div className="mt-4 flex items-center gap-2">
              {[Instagram, Linkedin, Facebook].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 py-6 text-xs text-[#333333]">
          <span>© {new Date().getFullYear()} Rono</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
