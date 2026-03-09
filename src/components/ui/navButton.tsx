"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const baseStyles =
  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 md:text-base";

const filledStyles =
  "bg-[#6666FF] text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] hover:bg-[#5555EE]";

const outlinedStyles =
  "border border-[#6666FF]/30 bg-[rgba(102,102,255,0.06)] text-[#6666FF] hover:bg-[rgba(102,102,255,0.12)]";

export type NavButtonVariant = "filled" | "outlined";

export interface NavButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NavButtonVariant;
}

export const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ variant = "filled", className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        baseStyles,
        variant === "filled" ? filledStyles : outlinedStyles,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  ),
);

NavButton.displayName = "NavButton";
