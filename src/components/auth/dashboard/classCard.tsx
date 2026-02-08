"use client"

import { ChevronRight, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

type ClassCardVariant = "blue" | "yellow" | "cyan"

interface ClassCardProps {
  name: string
  studentCount: number
  variant?: ClassCardVariant
  onClick?: () => void
}

const variantStyles: Record<
  ClassCardVariant,
  { iconBg: string; iconColor: string; badgeBg: string; badgeText: string }
> = {
  blue: {
    iconBg: "rgba(0, 109, 252, 0.22)",
    iconColor: "#0066EC",
    badgeBg: "rgba(0, 109, 252, 0.22)",
    badgeText: "#00306E",
  },
  yellow: {
    iconBg: "#F1F0BE",
    iconColor: "#E6CD0C",
    badgeBg: "#F1F0BE",
    badgeText: "#867705",
  },
  cyan: {
    iconBg: "#91E2F2",
    iconColor: "#47B6CA",
    badgeBg: "#91E2F2",
    badgeText: "#0D4F5D",
  },
}

export function ClassCard({
  name,
  studentCount,
  variant = "blue",
  onClick,
}: ClassCardProps) {
  const styles = variantStyles[variant]

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col justify-between p-4 text-left transition-all hover:scale-[1.02]"
      )}
      style={{ 
        minHeight: "127px",
        background: "rgba(255, 254, 254, 0.09)",
        border: "1px solid #5D5DFB",
        boxShadow: "0px 0px 20px 1px rgba(84, 164, 255, 0.65)",
        borderRadius: "15px"
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-[25px] w-[27px] items-center justify-center rounded-[3px]"
          style={{ background: styles.iconBg }}
        >
          <Folder className="h-3.5 w-3.5" style={{ color: styles.iconColor }} fill={styles.iconColor} />
        </div>
        <span
          className="rounded-[3px] px-2 py-0.5 text-[8px] font-semibold leading-[12px]"
          style={{ 
            background: styles.badgeBg,
            color: styles.badgeText
          }}
        >
          {studentCount} students
        </span>
      </div>
      <div className="flex items-center justify-between pt-6">
        <span className="text-[15px] font-semibold leading-[22px] text-[#00306E]">{name}</span>
        <ChevronRight className="h-5 w-5 text-[#00306E] transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}
