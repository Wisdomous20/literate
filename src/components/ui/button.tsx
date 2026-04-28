import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(93,93,251,0.24)] hover:-translate-y-0.5 hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_14px_30px_rgba(220,38,38,0.18)] hover:-translate-y-0.5 hover:brightness-105",
        outline:
          "border border-[var(--card-border-default)] bg-white/80 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-[var(--card-border-strong)] hover:bg-accent/70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        ghost:
          "text-foreground hover:bg-accent/70 hover:text-accent-foreground",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        xs: "h-7 rounded-xl px-2.5 text-xs",
        sm: "h-9 rounded-xl px-4 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "size-11",
        "icon-xs": "size-7 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
