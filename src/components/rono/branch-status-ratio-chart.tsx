"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface MonthStatusPoint {
  label: string;
  delivered: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface Props {
  data: MonthStatusPoint[];
}

const SERIES: Array<{ key: keyof Omit<MonthStatusPoint, "label">; label: string; color: string }> = [
  { key: "delivered", label: "Delivered", color: "#5E3EA1" },
  { key: "approved", label: "Approval", color: "#8C6FC4" },
  { key: "pending", label: "Pending", color: "#CDC3E2" },
  { key: "rejected", label: "Rejected", color: "#EFECF6" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-black">{label}</p>
      {SERIES.map((s) => {
        const entry = payload.find((p) => p.dataKey === s.key);
        return (
          <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[#4D4D4D]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold text-black">{entry?.value ?? 0}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BranchStatusRatioChart({ data }: Props) {
  const maxTotal = Math.max(
    1,
    ...data.map((d) => d.delivered + d.approved + d.pending + d.rejected),
  );
  const upperBound = Math.max(5, Math.ceil(maxTotal / 5) * 5);

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, upperBound]}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="status"
                fill={s.color}
                barSize={16}
                radius={i === SERIES.length - 1 ? [0, 4, 4, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-[#4D4D4D]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
