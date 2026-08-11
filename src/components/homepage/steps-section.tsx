import Image from "next/image";
import { MktHeadingAccent, MktHeadingText, SectionHeading } from "./section-heading";

export function StepsSection() {
  return (
    <section className="mkt-section bg-white">
      <SectionHeading
        title={
          <>
            <MktHeadingText>Manage Your LR in </MktHeadingText>
            <MktHeadingAccent>3 Steps</MktHeadingAccent>
          </>
        }
        subtitle="Create, manage, and track Lorry Receipts from one platform."
      />

      <div className="mkt-section-gap mx-auto w-full min-w-0 max-w-[990px]">
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
