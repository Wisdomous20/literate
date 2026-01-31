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
  { bg: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string }
> = {
  blue: {
    bg: "bg-blue-100/30",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
  },
  yellow: {
    bg: "bg-yellow-100/30",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
  },
  cyan: {
    bg: "bg-cyan-100/30",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-800",
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
        "group relative flex w-full flex-col justify-between rounded-2xl border border-primary/30 p-4 text-left shadow-lg shadow-accent/20 transition-all hover:shadow-xl",
        styles.bg
      )}
      style={{ minHeight: "120px" }}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded",
            styles.iconBg
          )}
        >
          <Folder className={cn("h-4 w-4", styles.iconColor)} />
        </div>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-semibold",
            styles.badgeBg,
            styles.badgeText
          )}
        >
          {studentCount} students
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{name}</span>
        <ChevronRight className="h-5 w-5 text-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}
