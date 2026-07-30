import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-white shadow-brand hover:opacity-95 focus-visible:ring-brand",
        destructive:
          "bg-[var(--brand-error)] text-white shadow-md hover:opacity-90 focus-visible:ring-[var(--brand-error)]/20",
        outline:
          "border border-[var(--brand-border)] bg-white hover:bg-[var(--brand-surface)] hover:border-brand hover:text-brand text-[var(--brand-text-muted)]",
        secondary:
          "bg-[var(--brand-primary-light)] text-white shadow-md hover:opacity-90",
        ghost:
          "hover:bg-brand-gradient-soft hover:text-brand text-[var(--brand-text-muted)]",
        link: "text-brand underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-4",
        sm: "h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
