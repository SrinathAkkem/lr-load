"use client";

import { useEffect, useRef, useState } from "react";
import { IconMoreDots } from "@/components/rono/dashboard-icons";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
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
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center text-[#5E3EA1] transition hover:opacity-70"
      >
        <IconMoreDots className="h-8 w-8" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          {items.map((item) => {
            const className = `flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium transition hover:bg-black/[0.04] ${
              item.danger ? "text-[#DE0000]" : "text-black"
            }`;
            const content = (
              <>
                {item.icon}
                {item.label}
              </>
            );
            if (item.href) {
              return (
                <a key={item.key} href={item.href} onClick={() => setOpen(false)} className={className}>
                  {content}
                </a>
              );
            }
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
