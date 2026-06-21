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
        src="/uploads/logos/RonoHubLogo.png"
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
        "rounded-lg bg-gradient-to-r from-[#7b4fd4] to-[#3b9fe8] px-6 py-3 font-bold text-white shadow-lg shadow-[#7b4fd4]/30 transition hover:shadow-xl hover:shadow-[#7b4fd4]/40 disabled:opacity-50",
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
    violet: "text-[#7b4fd4]",
    amber: "text-[#f5a623]",
    emerald: "text-[#2ecc71]",
    blue: "text-[#3b9fe8]",
    sky: "text-[#3b9fe8]",
  };

  return (
    <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">{title}</p>
          <p className={cn("mt-2 text-3xl font-extrabold", accents[accent])}>{value}</p>
          {subtitle && <p className="mt-1 text-sm font-semibold text-[#6b7280]">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-xl bg-[#e8edf5] p-2.5">{icon}</div>}
      </div>
    </div>
  );
}
