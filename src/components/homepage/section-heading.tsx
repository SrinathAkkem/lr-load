import { cn } from "@/lib/utils";

export const MKT_TITLE_CLASS = "mkt-title";
export const MKT_SUBTITLE_CLASS = "mkt-subtitle";
export const MKT_HERO_TITLE_CLASS = "mkt-hero-title";

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
        "relative flex w-full min-w-0 max-w-[1320px] flex-col justify-start gap-[clamp(0.75rem,2vw,1.5rem)]",
        isCenter ? "mx-auto items-center" : "items-start",
        className,
      )}
    >
      <h2 className={cn(MKT_TITLE_CLASS, "w-full min-w-0", isCenter ? "text-center" : "text-left")}>
        {typeof title === "string" ? <span className="text-black">{title}</span> : title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            MKT_SUBTITLE_CLASS,
            "w-full min-w-0 max-w-[49.75rem]",
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
