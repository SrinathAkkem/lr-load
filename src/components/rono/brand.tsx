import Image from "next/image";
import { cn } from "@/lib/utils";

export function RonoLogo({
  className,
  width = 120,
  height = 25,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/ronohub-logo.png"
        alt="Rono Hub Logo"
        width={width}
        height={height}
        className="object-contain"
        priority={false}
        unoptimized={true}
      />
    </div>
  );
}

export function RonoGradientButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-lg bg-brand-gradient px-6 py-3 font-bold text-white shadow-brand transition hover:opacity-95 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "violet",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "violet" | "amber" | "emerald" | "blue" | "sky";
}) {
  const accents = {
    violet: "text-brand",
    amber: "text-[var(--brand-warning)]",
    emerald: "text-[var(--brand-success)]",
    blue: "text-[var(--brand-info)]",
    sky: "text-[var(--brand-info)]",
  };

  return (
    <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">{title}</p>
          <p className={cn("mt-2 text-3xl font-extrabold", accents[accent])}>{value}</p>
          {subtitle && <p className="mt-1 text-sm font-semibold text-[var(--brand-text-muted)]">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-xl bg-[var(--brand-surface)] p-2.5">{icon}</div>}
      </div>
    </div>
  );
}
