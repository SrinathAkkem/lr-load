import Image from "next/image";
import { MktHeadingAccent, MktHeadingText, SectionHeading } from "./section-heading";

export function StepsSection() {
  return (
    <section className="mx-auto w-full max-w-[1440px] bg-white px-6 py-16 lg:px-10 lg:py-24">
      <SectionHeading
        title={
          <>
            <MktHeadingText>Manage Your LR in </MktHeadingText>
            <MktHeadingAccent>3 Steps</MktHeadingAccent>
          </>
        }
        subtitle="Create, manage, and track Lorry Receipts from one platform."
      />

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
