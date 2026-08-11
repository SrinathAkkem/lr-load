"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./section-heading";

const FAQS = [
  {
    q: "What is RONO LR?",
    a: "RONO simplifies Lorry Receipt management by enabling transport businesses to create, organize, store, and track digital LRs from one centralized platform.",
  },
  {
    q: "Can I create digital Lorry Receipts with RONO?",
    a: "Yes. RONO lets you generate professional, accurate Lorry Receipts in minutes using a simple guided form, with every LR stored securely for future access.",
  },
  {
    q: "Can I share Lorry Receipts with customers?",
    a: "Yes. LRs can be shared as PDFs or via WhatsApp directly from the platform, so customers and drivers always have the latest copy.",
  },
  {
    q: "Is my Lorry Receipt data secure?",
    a: "Yes. All your LR data is encrypted and stored securely on RONO's servers, with role-based access so only authorized users can view or edit records.",
  },
  {
    q: "Who can use RONO?",
    a: "RONO is built for transport companies, packers & movers, and logistics businesses of any size that want to move away from paper-based Lorry Receipts.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto w-full max-w-[1440px] bg-white px-6 py-16 lg:px-10 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            title="Frequently Asked Questions"
            subtitle="Find answers to common questions about RONO, digital Lorry Receipts, and how our platform simplifies transport documentation."
          />
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={
                  isOpen
                    ? "rounded-2xl border border-[#E57351] bg-[#FFF8F5] px-5 py-4 transition"
                    : "rounded-full bg-[#F5F7F7] px-6 py-4 transition"
                }
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span
                    className={`text-sm font-bold sm:text-[15px] ${
                      isOpen ? "text-[#E57351]" : "text-black"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-[#E57351]" : "text-black"
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-[#333333]">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
