"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  icon?: React.ReactNode;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function FilterDropdown({ icon, label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-full border border-[#5E3EA1] bg-white px-4 text-xs font-semibold text-[#5E3EA1] transition hover:bg-[#5E3EA1]/5"
      >
        {icon}
        <span className="max-w-[140px] truncate">{selected?.label ?? label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#5E3EA1]" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-30 max-h-64 w-52 overflow-y-auto rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3.5 py-2 text-left text-sm transition hover:bg-black/[0.04] ${
                opt.value === value ? "font-semibold text-[#5E3EA1]" : "text-black"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
