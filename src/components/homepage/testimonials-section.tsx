import { Star } from "lucide-react";
import { SectionHeading, MktHeadingAccent, MktHeadingText } from "./section-heading";

const AVATAR_COLORS = ["bg-[#4882C2]", "bg-[#50308E]", "bg-[#F25E2B]"];

const TESTIMONIALS = [
  {
    name: "Rajesh Sharma",
    role: "Transport Company Owner",
    quote:
      "RONO has completely replaced our manual LR books. Creating and managing Lorry Receipts is now much faster, and finding old records takes just a few seconds.",
    rating: "4.5",
  },
  {
    name: "Vikram Singh",
    role: "Logistics Manager",
    quote:
      "Managing hundreds of Lorry Receipts every month has become effortless. Everything is securely stored, well organized, and easy to access whenever we need it.",
    rating: "4.8",
  },
  {
    name: "Priya Patel",
    role: "Packers & Movers Owner",
    quote:
      "Sharing digital Lorry Receipts with our customers has improved our workflow significantly. The platform is simple to use and has helped us reduce paperwork.",
    rating: "4.9",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function TestimonialsSection() {
  return (
    <section className="mkt-section">
      <SectionHeading
        title={
          <>
            <MktHeadingText>What Our Customers </MktHeadingText>
            <MktHeadingAccent>Are Saying</MktHeadingAccent>
          </>
        }
        subtitle="Trusted by transport businesses for faster, smarter, and paperless Lorry Receipt management."
      />

      <div className="mkt-section-gap grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={t.name} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {initials(t.name)}
              </span>
              <div>
                <p className="text-sm font-medium text-black">{t.name}</p>
                <p className="text-xs text-[#666666]">{t.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#666666]">{t.quote}</p>
            <div className="mt-5 flex items-center justify-end gap-1 text-sm font-medium text-black">
              {t.rating} <Star className="h-4 w-4 fill-[#FDE021] text-[#FDE021]" /> Ratings
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
