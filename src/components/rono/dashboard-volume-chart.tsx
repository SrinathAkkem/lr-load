"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { ChevronDown } from "lucide-react";

export interface MonthPoint {
  label: string;
  count: number;
}

interface Props {
  monthly: MonthPoint[];
}

function TopLabel({
  x,
  y,
  width,
  value,
  highlight,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  highlight: boolean;
}) {
  if (!highlight || x === undefined || y === undefined || width === undefined) return null;
  const cx = x + width / 2;
  return (
    <g>
      <rect x={cx - 20} y={y - 28} width={40} height={22} rx={11} fill="#5E3EA1" />
      <text x={cx} y={y - 13} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
        {value}
      </text>
    </g>
  );
}

export function DashboardVolumeChart({ monthly }: Props) {
  const [range, setRange] = useState<"Yearly" | "Monthly">("Yearly");
  const maxIndex = useMemo(() => {
    if (monthly.length === 0) return -1;
    let idx = 0;
    for (let i = 1; i < monthly.length; i++) {
      if (monthly[i].count > monthly[idx].count) idx = i;
    }
    return idx;
  }, [monthly]);

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-black">LR Volume</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRange((r) => (r === "Yearly" ? "Monthly" : "Yearly"))}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#5E3EA1]"
          >
            {range}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 h-64">
        {monthly.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 30, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Bar dataKey="count" radius={[6, 6, 6, 6]} maxBarSize={28}>
                {monthly.map((_, i) => (
                  <Cell key={i} fill={i === maxIndex ? "#5E3EA1" : "#E6E6E6"} />
                ))}
                <LabelList
                  dataKey="count"
                  content={(props) => (
                    <TopLabel {...props} highlight={props.index === maxIndex} />
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
