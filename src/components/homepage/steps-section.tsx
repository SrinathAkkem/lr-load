import Image from "next/image";

export function StepsSection() {
  return (
    <section className="mx-auto w-full max-w-[1440px] bg-white px-6 py-16 lg:px-10 lg:py-24">
      <h2 className="text-center text-3xl font-extrabold text-black sm:text-4xl">
        Manage Your LR in <span className="text-[#F25828]">3 Steps</span>
      </h2>
      <p className="mt-3 text-center text-base text-[#4D4D4D]">
        Create, manage, and track Lorry Receipts from one platform.
      </p>

      <div className="mx-auto mt-14 w-full max-w-[990px] bg-white">
        <Image
          src="/homepage/frame-425-steps.png"
          alt="Create LR, Share and Manage LR, and Track LR"
          width={990}
          height={390}
          className="block h-auto w-full bg-white"
          sizes="(max-width: 990px) 100vw, 990px"
          priority
          draggable={false}
        />
      </div>
    </section>
  );
}
