"use client"

import { useRouter } from "next/navigation"
import { MoreVertical } from "lucide-react"

interface BreakdownItem {
  label: string
  value: string | number
  color: string
  textColor: string
}

const breakdownItems: BreakdownItem[] = [
  { label: "Literal", value: "--", color: "rgba(160, 200, 255, 0.4)", textColor: "#1A5FB4" },
  { label: "Inferential", value: "--", color: "rgba(180, 170, 240, 0.4)", textColor: "#4B3BA3" },
  { label: "Critical", value: "--", color: "rgba(253, 182, 210, 0.44)", textColor: "#C41048" },
]

interface ComprehensionBreakdownProps {
  score?: number
  totalItems?: number
  level?: string
  disabled?: boolean
}

export function ComprehensionBreakdown({
  score = 0,
  totalItems = 0,
  level = "--",
  disabled = false,
}: ComprehensionBreakdownProps) {
  const router = useRouter()

  return (
    <div
      className={`flex h-full flex-col rounded-[20px] px-5 py-4 transition-opacity duration-300 ${disabled ? "pointer-events-none opacity-40" : "opacity-100"}`}
      style={{
        background: "#EFFDFF",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
      }}
    >
      {/* Title */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF] mb-3 block">
        Comprehension Breakdown
      </span>

      {/* Breakdown Items */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {breakdownItems.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                {/* Color-coded badge */}
                <div
                  className="flex h-6 w-7 items-center justify-center rounded-[5px] text-sm font-bold"
                  style={{
                    background: item.color,
                    border: "1px solid #DAE6FF",
                    color: item.textColor,
                  }}
                >
                  {item.value}
                </div>
                {/* Label */}
                <span
                  className="text-sm font-bold"
                  style={{ color: "#31318A" }}
                >
                  {item.label}
                </span>
              </div>
              {/* Three-dot menu */}
              <MoreVertical className="h-4 w-4 text-[#00454D]" />
            </div>
            {/* Divider */}
            {index < breakdownItems.length - 1 && (
              <div
                className="h-px"
                style={{ background: "rgba(18, 48, 220, 0.25)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Results */}
      <div className="mt-auto pt-3">
        <div className="flex flex-col gap-1.5">
          {/* Score */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(230, 230, 250, 0.5)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Score
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}
            >
              {disabled ? "--" : `${score}/${totalItems}`}
            </span>
          </div>

          {/* Percentage */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(230, 230, 250, 0.35)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Percentage
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}
            >
              {disabled || totalItems === 0
                ? "--"
                : `${Math.round((score / totalItems) * 100)}%`}
            </span>
          </div>

          {/* Level */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(230, 230, 250, 0.2)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Comprehension Level
            </span>
            <span
              className="text-[17px] font-semibold"
              style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}
            >
              {level}
            </span>
          </div>
        </div>

        {/* View Full Report Button */}
        <div className="mt-2.5 flex justify-center">
          <button
            onClick={() => router.push("/dashboard/oral-reading-test/comprehension/report")}
            className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "#6666FF" }}
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  )
}
