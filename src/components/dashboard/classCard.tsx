"use client";

import { ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

type ClassCardVariant = "blue" | "yellow" | "cyan";

interface ClassCardProps {
  name: string;
  studentCount: number;
  variant?: ClassCardVariant;
  onClick?: () => void;
}

const variantStyles: Record<
  ClassCardVariant,
  {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  blue: {
    iconBg: "bg-[rgba(0,109,252,0.22)]",
    iconColor: "text-[#0066EC]",
    badgeBg: "bg-[rgba(0,109,252,0.22)]",
    badgeText: "text-[#00306E]",
  },
  yellow: {
    iconBg: "bg-[#F1F0BE]",
    iconColor: "text-[#E6CD0C]",
    badgeBg: "bg-[#F1F0BE]",
    badgeText: "text-[#867705]",
  },
  cyan: {
    iconBg: "bg-[#91E2F2]",
    iconColor: "text-[#47B6CA]",
    badgeBg: "bg-[#91E2F2]",
    badgeText: "text-[#0D4F5D]",
  },
};

export function ClassCard({
  name,
  studentCount,
  variant = "blue",
  onClick,
}: ClassCardProps) {
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full min-h-[127px] flex-col justify-between rounded-[15px] border border-[#5D5DFB] bg-[rgba(255,254,254,0.09)] p-4 text-left shadow-[0px_0px_20px_1px_rgba(84,164,255,0.65)] transition-all hover:scale-[1.02]",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-[25px] w-[27px] items-center justify-center rounded-[3px]",
            styles.iconBg,
          )}
        >
          <Folder className={cn("h-3.5 w-3.5", styles.iconColor)} />
        </div>

        <span
          className={cn(
            "rounded-[3px] px-2 py-0.5 text-[8px] font-semibold leading-[12px]",
            styles.badgeBg,
            styles.badgeText,
          )}
        >
          {studentCount} students
        </span>
      </div>

      <div className="flex items-center justify-between pt-6">
        <span className="text-[15px] font-semibold leading-[22px] text-[#00306E]">
          {name}
        </span>
        <ChevronRight className="h-5 w-5 text-[#00306E] transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}
