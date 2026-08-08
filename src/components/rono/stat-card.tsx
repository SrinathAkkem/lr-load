import { ArrowUp, ArrowDown } from "lucide-react";

export function StatCard({
  icon,
  iconBg,
  topRight,
  title,
  value,
  valueColor,
  trend,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  topRight: string;
  title: string;
  value: string | number;
  valueColor: string;
  trend?: { direction: "up" | "down"; value: string };
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[10px] font-semibold text-[#4D4D4D]">
          {topRight}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-[#4D4D4D]">{title}</p>
          <p className={`mt-0.5 text-3xl font-bold ${valueColor}`}>{value}</p>
          {subtitle && <p className="mt-1 text-[11px] text-[#9CA3AF]">{subtitle}</p>}
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${
              trend.direction === "up" ? "bg-[#0C6B24]/10 text-[#0C6B24]" : "bg-[#DE0000]/10 text-[#DE0000]"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
