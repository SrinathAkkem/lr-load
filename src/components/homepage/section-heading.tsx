import { cn } from "@/lib/utils";

const TITLE_CLASS =
  "shrink-0 text-[32px] font-semibold sm:text-[44px] lg:text-[56px]";
const SUBTITLE_CLASS =
  "shrink-0 w-full max-w-[796px] text-lg text-[#4E4E4E] sm:text-xl lg:text-[26px]";

type SectionHeadingProps = {
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  subtitleClassName?: string;
};

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
  subtitleClassName,
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[1320px] flex-col justify-start gap-6",
        isCenter ? "items-center" : "items-start",
        className,
      )}
    >
      <h2 className={cn(TITLE_CLASS, isCenter ? "text-center" : "text-left")}>
        {typeof title === "string" ? <span className="text-black">{title}</span> : title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            SUBTITLE_CLASS,
            isCenter ? "text-center" : "text-left",
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function MktHeadingAccent({ children }: { children: React.ReactNode }) {
  return <span className="text-[#F25828]">{children}</span>;
}

export function MktHeadingText({ children }: { children: React.ReactNode }) {
  return <span className="text-black">{children}</span>;
}
