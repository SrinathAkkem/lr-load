import { cn } from "@/lib/utils";

export function RonoLogo({
  className,
  logoSrc = "/uploads/logos/RonoHubLogo.png",
  width = 32,
  height = 20,
}: {
  className?: string;
  logoSrc?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="Rono logo"
        width={width}
        height={height}
        className="object-contain"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.dataset.errorCount === undefined) {
            target.dataset.errorCount = "0";
          }
          const errorCount = parseInt(target.dataset.errorCount, 10);
          if (errorCount < 2) {
            target.dataset.errorCount = String(errorCount + 1);
            console.warn(`Failed to load logo from ${logoSrc}, retrying...`);
            // Retry with a small delay
            setTimeout(() => {
              target.src = logoSrc + "?retry=" + Date.now();
            }, 500);
          } else {
            console.error(`Failed to load logo from ${logoSrc} after retries`);
            target.style.display = "none";
          }
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
