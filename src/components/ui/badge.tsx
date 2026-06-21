import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[#f0ebfc] text-[#7b4fd4] [a&]:hover:bg-[#e5dcfa]",
        secondary:
          "bg-[#ebf5fd] text-[#3b9fe8] [a&]:hover:bg-[#d6ebfa]",
        destructive:
          "bg-[#fdedec] text-[#e74c3c] [a&]:hover:bg-[#fcdcda]",
        success:
          "bg-[#e8f8f0] text-[#2ecc71] [a&]:hover:bg-[#d4f4e5]",
        warning:
          "bg-[#fef3e0] text-[#f5a623] [a&]:hover:bg-[#fde9c7]",
        outline:
          "border border-[#e8edf5] text-[#6b7280] [a&]:hover:bg-[#fafbff] [a&]:hover:text-[#7b4fd4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
