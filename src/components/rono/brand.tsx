import { cn } from "@/lib/utils";

export function RonoLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute h-4 w-4 rounded-full bg-pink-400 opacity-90" style={{ left: 2, top: 4 }} />
        <span className="absolute h-4 w-4 rounded-full bg-cyan-400 opacity-90" style={{ left: 10, top: 0 }} />
        <span className="absolute h-4 w-4 rounded-full bg-amber-400 opacity-90" style={{ left: 14, top: 8 }} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        rono<span className="font-normal">hub</span>
      </span>
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
