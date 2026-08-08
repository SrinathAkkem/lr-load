"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SUBJECT_LABELS } from "@/lib/validations/contact-enquiry";

const SUBJECT_OPTIONS = Object.entries(SUBJECT_LABELS);

export function ContactSubjectDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (subject: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = value && SUBJECT_LABELS[value] ? SUBJECT_LABELS[value] : "Choose subject";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm outline-none focus:border-[#5E3EA1]"
      >
        <span className={value ? "text-black" : "text-[#9CA3AF]"}>
          {selectedLabel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-xl"
        >
          {SUBJECT_OPTIONS.map(([subject, label]) => (
            <button
              key={subject}
              type="button"
              role="option"
              aria-selected={value === subject}
              className="block w-full px-4 py-3 text-left text-sm text-[#4D4D4D] transition hover:bg-[#F5F5F7] hover:text-black"
              onClick={() => {
                onChange(subject);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
