"use client"

import { useRouter } from "next/navigation"

interface BreakdownItem {
  label: string
  key: "literal" | "inferential" | "critical"
  rowHighlightClass: string
  textClass: string
  badgeClass: string
}

const breakdownItems: BreakdownItem[] = [
  {
    label: "Literal",
    key: "literal",
    rowHighlightClass: "bg-[rgba(160,200,255,0.4)]",
    textClass: "text-[#1A5FB4]",
    badgeClass: "bg-[rgba(160,200,255,0.4)] text-[#1A5FB4]",
  },
  {
    label: "Inferential",
    key: "inferential",
    rowHighlightClass: "bg-[rgba(180,170,240,0.4)]",
    textClass: "text-[#4B3BA3]",
    badgeClass: "bg-[rgba(180,170,240,0.4)] text-[#4B3BA3]",
  },
  {
    label: "Critical",
    key: "critical",
    rowHighlightClass: "bg-[rgba(253,182,210,0.44)]",
    textClass: "text-[#C41048]",
    badgeClass: "bg-[rgba(253,182,210,0.44)] text-[#C41048]",
  },
]

interface TagBreakdown {
  literal: { correct: number; total: number }
  inferential: { correct: number; total: number }
  critical: { correct: number; total: number }
}

interface ComprehensionBreakdownProps {
  score?: number
  totalItems?: number
  level?: string
  tagBreakdown?: TagBreakdown
  disabled?: boolean
  highlightedTag?: "literal" | "inferential" | "critical" | null
  onTagClick?: (tag: "literal" | "inferential" | "critical") => void
}

function getLevelClasses(level: string): { bgClass: string; textClass: string } {
  if (!level) return { bgClass: "bg-[rgba(230,230,250,0.2)]", textClass: "text-[#2E2EA3]" }

  switch (level.toLowerCase()) {
    case "frustration":
      return { bgClass: "bg-[rgba(220,38,38,0.15)]", textClass: "text-[#DC2626]" }
    case "instructional":
      return { bgClass: "bg-[rgba(37,99,235,0.15)]", textClass: "text-[#2563EB]" }
    case "independent":
      return { bgClass: "bg-[rgba(22,163,74,0.15)]", textClass: "text-[#16A34A]" }
    default:
      return { bgClass: "bg-[rgba(230,230,250,0.2)]", textClass: "text-[#2E2EA3]" }
  }
}

export function ComprehensionBreakdown({
  score = 0,
  totalItems = 0,
  level = "--",
  tagBreakdown,
  disabled = false,
  highlightedTag = null,
  onTagClick,
}: ComprehensionBreakdownProps) {
  const router = useRouter()
  const levelClasses = getLevelClasses(level)

  return (
    <div
      className={`flex h-full flex-col rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] px-5 py-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)] transition-opacity duration-300 ${
        disabled ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
    >
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
        Comprehension Breakdown
      </span>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {breakdownItems.map((item, index) => {
          const tagData = tagBreakdown?.[item.key]
          const displayValue = tagData ? `${tagData.correct}/${tagData.total}` : "--"
          const isHighlighted = highlightedTag === item.key

          return (
            <div key={item.label}>
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-all duration-200 ${
                  isHighlighted ? item.rowHighlightClass : "bg-transparent"
                }`}
                onClick={() => onTagClick && onTagClick(item.key)}
              >
                <span className={`text-sm font-bold ${item.textClass}`}>{item.label}</span>
                <div
                  className={`flex h-6 w-7 items-center justify-center rounded-[5px] text-sm font-bold ${
                    isHighlighted ? `bg-white ${item.textClass}` : item.badgeClass
                  }`}
                >
                  {displayValue}
                </div>
              </div>
              {index < breakdownItems.length - 1 && (
                <div className="h-px bg-[rgba(18,48,220,0.25)]" />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.5)] px-3 py-1.5">
            <span className="text-xs font-bold text-[#31318A]">Total Score:</span>
            <span className="font-[Kanit,sans-serif] text-[17px] font-semibold text-[#2E2EA3]">
              {disabled ? "--" : `${score}/${totalItems}`}
            </span>
          </div>

          <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.35)] px-3 py-1.5">
            <span className="text-xs font-bold text-[#31318A]">Comprehension Rate:</span>
            <span className="font-[Kanit,sans-serif] text-[17px] font-semibold text-[#2E2EA3]">
              {disabled || totalItems === 0
                ? "--"
                : `${Math.round((score / totalItems) * 100)}%`}
            </span>
          </div>

          <div className={`flex items-center justify-between rounded px-3 py-1.5 ${levelClasses.bgClass}`}>
            <span className="text-xs font-bold text-[#31318A]">Comprehension Level:</span>
            <span className={`font-[Kanit,sans-serif] text-[17px] font-semibold ${levelClasses.textClass}`}>
              {level}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/dashboard/oral-reading-test/comprehension/report")}
            className="mt-3 w-full rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  )
}