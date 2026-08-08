"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, CalendarDays } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** @deprecated the pill style is now the only style; kept for call-site compatibility. */
  variant?: "solid" | "outline";
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (from ? new Date(from) : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function handlePick(d: Date) {
    if (!fromDate || (fromDate && toDate)) {
      onChange(toISO(d), "");
    } else if (d < fromDate) {
      onChange(toISO(d), toISO(fromDate));
    } else {
      onChange(toISO(fromDate), toISO(d));
    }
  }

  const label =
    fromDate && toDate
      ? `${fromDate.toLocaleDateString("en-IN", { day: "2-digit", month: "numeric" })} - ${toDate.toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "numeric" },
        )}`
      : "From - To";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-full border border-[#5E3EA1] bg-white px-4 text-xs font-semibold text-[#5E3EA1] transition hover:bg-[#5E3EA1]/5"
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{label}</span>
        {(from || to) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-72 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#4D4D4D] hover:bg-black/[0.04]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-black">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#4D4D4D] hover:bg-black/[0.04]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-semibold text-[#9CA3AF]">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const isFrom = fromDate && isSameDay(d, fromDate);
              const isTo = toDate && isSameDay(d, toDate);
              const inRange = fromDate && toDate && d > fromDate && d < toDate;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePick(d)}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition ${
                    isFrom || isTo
                      ? "bg-[#5E3EA1] text-white"
                      : inRange
                        ? "bg-[#5E3EA1]/10 text-[#5E3EA1]"
                        : "text-black hover:bg-black/[0.04]"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="text-xs font-semibold text-[#4D4D4D] hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-[#5E3EA1] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
