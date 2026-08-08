"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  freightTotal: number;
}

const LEGEND = [
  { label: "Base Rate", pct: 55, color: "#5E3EA1" },
  { label: "Fuel Charges", pct: 20, color: "#8C6FC4" },
  { label: "Accessorial Charge", pct: 10, color: "#CDC3E2" },
  { label: "Handling", pct: 15, color: "#EFECF6" },
];

function formatFreight(amount: number) {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)} K`;
  return `${amount}`;
}

export function BranchExpenseDonut({ freightTotal }: Props) {
  const data = LEGEND.map((l) => ({ name: l.label, value: l.pct }));

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={LEGEND[i].color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-black">{formatFreight(freightTotal)}*</p>
          <p className="text-xs text-[#4D4D4D]">Freight Amount</p>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-x-6 gap-y-2">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-[#4D4D4D]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="font-semibold text-black">{l.pct}%</span>
            <span className="truncate">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
