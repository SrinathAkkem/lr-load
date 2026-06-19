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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/uploads/logos/RonoHubLogo.png"
        alt="Rono Hub Logo"
        className="object-contain"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: "100%",
          display: "block",
        }}
        onLoad={() => {
          console.log("✓ Logo loaded successfully");
        }}
        onError={(e) => {
          console.error("✗ Failed to load logo from /uploads/logos/RonoHubLogo.png");
          const target = e.currentTarget;
          // Show error indicator
          target.style.background = "#fee";
          target.style.border = "1px solid #f88";
          target.style.borderRadius = "4px";
        }}
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
        "rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-600 disabled:opacity-50",
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
    violet: "text-violet-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    sky: "text-sky-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className={cn("mt-2 text-3xl font-bold", accents[accent])}>{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-xl bg-slate-50 p-2.5">{icon}</div>}
      </div>
    </div>
  );
}
