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
    <section className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-10">
      <p className="text-center text-sm font-semibold text-[#666666]">Used by Industry Leaders</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-14 gap-y-6 opacity-90">
        {LOGOS.map((logo) => (
          <Image
            key={logo.alt}
            src={logo.src}
            alt={logo.alt}
            width={140}
            height={logo.h}
            style={{ height: logo.h, width: "auto" }}
            className="object-contain"
          />
        ))}
      </div>
    </section>
  );
}
