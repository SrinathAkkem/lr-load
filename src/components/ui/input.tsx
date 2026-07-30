import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#2d2d4e] placeholder:text-[#9ca3af] selection:bg-brand selection:text-white border-[#e8edf5] flex h-11 w-full min-w-0 rounded-lg border bg-white px-4 py-2 text-base font-semibold text-[#2d2d4e] shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-brand focus-visible:ring-brand focus-visible:ring-2",
        "aria-invalid:ring-[#fdedec] aria-invalid:border-[#e74c3c]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
