import Image from "next/image";
import { MktHeadingAccent, MktHeadingText, SectionHeading } from "./section-heading";

export function FeaturesSection() {
  return (
    <section className="mkt-section bg-white">
      <SectionHeading
        title={
          <>
            <MktHeadingText>Smarter LR </MktHeadingText>
            <MktHeadingAccent>Management</MktHeadingAccent>
          </>
        }
        subtitle="Digitize and manage your Lorry Receipts with ease."
      />

      <div className="mkt-section-gap mx-auto w-full min-w-0 max-w-[990px]">
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
