"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <section id="faq" className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <h2 className="text-3xl font-extrabold text-black sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-sm text-base text-[#4D4D4D]">
            Find answers to common questions about RONO, digital Lorry Receipts, and how our
            platform simplifies transport documentation.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border px-5 py-4 transition ${
                  isOpen ? "border-[#F25828]/40 bg-[#FFF4EF]" : "border-transparent bg-[#F5F5F7]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className={`text-sm font-semibold ${isOpen ? "text-[#F25828]" : "text-black"}`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#F25828]" : "text-black"}`}
                  />
                </button>
                {isOpen && <p className="mt-3 text-sm leading-relaxed text-[#4D4D4D]">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
