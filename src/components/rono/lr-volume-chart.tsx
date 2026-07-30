"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface VolumePoint {
  /** YYYY-MM-DD or formatted label depending on `range`. */
  date: string;
  count: number;
}

interface Props {
  daily: VolumePoint[];
  weekly?: VolumePoint[];
  monthly?: VolumePoint[];
  title?: string;
  highlightLastN?: number;
}

const RANGES = ["7D", "30D", "12M"] as const;
type Range = (typeof RANGES)[number];

/**
 * Bar chart of LR submissions over time. Defaults to the last 7 days; the
 * 30D/12M tabs require the parent to pass aggregated data so the chart stays
 * a dumb presenter (no fetching or aggregation here).
 */
export function LrVolumeChart({
  daily,
  weekly,
  monthly,
  title = "LR Volume",
  highlightLastN = 1,
}: Props) {
  const [range, setRange] = useState<Range>("7D");
  const data =
    range === "7D" ? daily : range === "30D" ? (weekly ?? daily) : (monthly ?? daily);

  const maxIndex = data.length - 1;

  return (
    <div className={title ? "rounded-2xl border bg-white p-6 shadow-sm" : ""}>
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-slate-500">
              {range === "7D"
                ? "Last 7 days"
                : range === "30D"
                  ? "Last 30 days"
                  : "Last 12 months"}
            </p>
          </div>
          <div className="flex gap-1 rounded-full border bg-slate-50 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  range === r
                    ? "bg-primary text-white shadow"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {!title && (
        <div className="flex justify-end">
          <div className="flex gap-1 rounded-full border bg-slate-50 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  range === r
                    ? "bg-primary text-white shadow"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 h-56">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data for this range yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(124,58,237,0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  padding: 8,
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i > maxIndex - highlightLastN ? "#7C3AED" : "#C4B5FD"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
