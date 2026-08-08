import Image from "next/image";

export function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-[1440px] bg-white px-6 py-16 lg:px-10 lg:py-24">
      <h2 className="text-center text-3xl font-extrabold text-black sm:text-4xl">
        Smarter LR <span className="text-[#F25828]">Management</span>
      </h2>
      <p className="mt-3 text-center text-base text-[#4D4D4D]">
        Digitize and manage your Lorry Receipts with ease.
      </p>

      <div className="mx-auto mt-14 w-full max-w-[990px] bg-white">
        <Image
          src="/homepage/frame-429-features.png"
          alt="Instant LR creation, centralized LR records, real-time LR tracking, and scalable business management"
          width={990}
          height={1473}
          className="block h-auto w-full bg-white"
          sizes="(max-width: 990px) 100vw, 990px"
          draggable={false}
        />
      </div>
    </section>
  );
}
