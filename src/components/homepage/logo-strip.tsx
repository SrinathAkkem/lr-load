import Image from "next/image";

const LOGOS = [
  { src: "/homepage/logos/blue-dart.png", alt: "Blue Dart", h: 28 },
  { src: "/homepage/logos/tci-express.png", alt: "TCI Express", h: 22 },
  { src: "/homepage/logos/ekart.png", alt: "eKart", h: 26 },
  { src: "/homepage/logos/delhivery.png", alt: "Delhivery", h: 20 },
  { src: "/homepage/logos/mahindra-logistics.png", alt: "Mahindra Logistics", h: 26 },
];

export function LogoStrip() {
  return (
    <section className="mkt-container py-[clamp(1.75rem,4vw,2.5rem)]">
      <p className="mkt-subtitle text-center">Used by Industry Leaders</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-[clamp(1.5rem,5vw,3.5rem)] gap-y-4 opacity-90 sm:mt-8 sm:gap-y-6">
        {LOGOS.map((logo) => (
          <Image
            key={logo.alt}
            src={logo.src}
            alt={logo.alt}
            width={140}
            height={logo.h}
            style={{ height: logo.h, width: "auto" }}
            className="h-auto max-h-[clamp(1rem,4vw,1.75rem)] w-auto max-w-[min(35vw,8.75rem)] object-contain"
          />
        ))}
      </div>
    </section>
  );
}
