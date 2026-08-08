import { Star } from "lucide-react";

const AVATAR_COLORS = ["bg-[#5E3EA1]", "bg-[#3C60B6]", "bg-[#F25828]"];

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
    <section className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10 lg:py-24">
      <h2 className="text-center text-3xl font-extrabold text-black sm:text-4xl">
        What Our Customers Are Saying
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-center text-base text-[#4D4D4D]">
        Trusted by transport businesses for faster, smarter, and paperless Lorry Receipt
        management.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={t.name} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {initials(t.name)}
              </span>
              <div>
                <p className="text-sm font-bold text-black">{t.name}</p>
                <p className="text-xs text-[#9CA3AF]">{t.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#4D4D4D]">{t.quote}</p>
            <div className="mt-5 flex items-center justify-end gap-1 text-sm font-semibold text-black">
              {t.rating} <Star className="h-4 w-4 fill-[#F7CE25] text-[#F7CE25]" /> Ratings
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
