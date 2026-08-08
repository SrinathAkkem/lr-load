"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, FileSpreadsheet } from "lucide-react";

export function ExportMenu({ pdfHref, csvHref }: { pdfHref: string; csvHref: string }) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-lg bg-[#5E3EA1] px-4 text-xs font-semibold text-white transition hover:opacity-90"
      >
        Export As
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-36 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          <a
            href={pdfHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
          >
            <FileText className="h-4 w-4 text-[#DE0000]" />
            PDF
          </a>
          <a
            href={csvHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#0C6B24]" />
            CSV
          </a>
        </div>
      )}
    </div>
  );
}
