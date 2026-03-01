"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { MiscueResult } from "@/types/oral-reading"

const MISCUE_CONFIG = [
  { key: "MISPRONUNCIATION", label: "Mispronunciation", color: "rgba(253, 182, 210, 0.44)", textColor: "#C41048" },
  { key: "OMISSION", label: "Omission", color: "rgba(180, 170, 240, 0.4)", textColor: "#4B3BA3" },
  { key: "SUBSTITUTION", label: "Substitution", color: "rgba(160, 200, 255, 0.4)", textColor: "#1A5FB4" },
  { key: "TRANSPOSITION", label: "Transposition", color: "rgba(220, 120, 220, 0.4)", textColor: "#8B008B" },
  { key: "REVERSAL", label: "Reversal", color: "rgba(200, 165, 130, 0.35)", textColor: "#6E4023" },
  { key: "INSERTION", label: "Insertion", color: "rgba(140, 220, 160, 0.4)", textColor: "#1E7A35" },
  { key: "REPETITION", label: "Repetition", color: "rgba(255, 200, 140, 0.45)", textColor: "#B85C00" },
  { key: "SELF_CORRECTION", label: "Self-Correction", color: "rgba(250, 230, 140, 0.45)", textColor: "#8A6D00" },
] as const

interface MiscueAnalysisProps {
  miscues?: MiscueResult[]
  totalMiscue?: number
  oralFluencyScore?: number | string
  classificationLevel?: string
  isAnalyzing?: boolean
  disabled?: boolean
  highlightedTypes?: Set<string>
  onToggleHighlight?: (miscueType: string) => void
}

export function MiscueAnalysis({
  miscues = [],
  totalMiscue,
  oralFluencyScore,
  classificationLevel,
  isAnalyzing = false,
  disabled = false,
  highlightedTypes = new Set(),
  onToggleHighlight,
}: MiscueAnalysisProps) {
  const router = useRouter()

  const miscueCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of miscues) {
      counts[m.miscueType] = (counts[m.miscueType] || 0) + 1
    }
    return counts
  }, [miscues])

  const hasResults = miscues.length > 0 || (totalMiscue !== undefined && totalMiscue > 0)

  const displayTotalMiscue = totalMiscue ?? (hasResults ? miscues.filter(m => !m.isSelfCorrected).length : 0)
  const displayScore = oralFluencyScore !== undefined ? (typeof oralFluencyScore === "number" ? `${oralFluencyScore}%` : oralFluencyScore) : "--"
  const displayClassification = classificationLevel || "--"

  const classificationColor = (() => {
    switch (classificationLevel?.toUpperCase()) {
      case "INDEPENDENT": return { text: "#1E7A35", bg: "rgba(140, 220, 160, 0.3)" }
      case "INSTRUCTIONAL": return { text: "#1A5FB4", bg: "rgba(160, 200, 255, 0.3)" }
      case "FRUSTRATION": return { text: "#C41048", bg: "rgba(253, 182, 210, 0.3)" }
      default: return { text: "#2E2EA3", bg: "rgba(230, 230, 250, 0.2)" }
    }
  })()

  return (
    <div
      className={`flex h-full flex-col rounded-[10px] px-5 py-4 transition-opacity duration-300 ${disabled && !isAnalyzing ? "pointer-events-none opacity-60" : "opacity-100"}`}
      style={{
        background: "#EFFDFF",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
      }}
    >
      {/* Title */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF] mb-2 block">
        Miscue Analysis
      </span>

      {/* Loading state while analyzing */}
      {isAnalyzing ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
          <span className="text-sm font-medium text-[#31318A]">Analyzing reading fluency...</span>
          <span className="text-xs text-[#31318A]/60">This may take a moment</span>
        </div>
      ) : (
        <>
          {/* Miscue Items List — scrollable if needed on small screens */}
          <div className="flex flex-1 flex-col">
            {MISCUE_CONFIG.map((item, index) => {
              const isActive = highlightedTypes.has(item.key)
              const count = miscueCounts[item.key] || 0
              return (
                <div key={item.key}>
                  <button
                    className="flex w-full items-center justify-between rounded-md px-1.5 py-1.5 transition-colors"
                    style={{
                      background: isActive ? item.color.replace(/[\d.]+\)$/, "0.18)") : "transparent",
                    }}
                    onClick={() => onToggleHighlight?.(item.key)}
                  >
                    {/* Left: count badge */}
                    <div
                      className="flex h-6 w-7 shrink-0 items-center justify-center rounded-[5px] text-sm font-bold"
                      style={{
                        background: item.color,
                        border: "1px solid #DAE6FF",
                        color: item.textColor,
                      }}
                    >
                      {count}
                    </div>
                    {/* Right: label */}
                    <span
                      className="text-sm font-bold"
                      style={{ color: item.textColor }}
                    >
                      {item.label}
                    </span>
                  </button>
                  {/* Divider (not after the last item) */}
                  {index < MISCUE_CONFIG.length - 1 && (
                    <div
                      className="h-px"
                      style={{ background: "rgba(18, 48, 220, 0.25)" }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom section: Results + Button — always pinned to bottom */}
          <div className="mt-auto pt-2">
            {/* Results Section */}
            <div className="flex flex-col gap-1.5">
              {/* Total Miscue */}
              <div
                className="flex items-center justify-between rounded px-3 py-1.5"
                style={{ background: "rgba(230, 230, 250, 0.5)" }}
              >
                <span className="text-xs font-bold" style={{ color: "#31318A" }}>
                  Total Miscue: 
                </span>
                <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}>
                  {displayTotalMiscue}
                </span>
              </div>

              {/* Oral Fluency Score */}
              <div
                className="flex items-center justify-between rounded px-3 py-1.5"
                style={{ background: "rgba(230, 230, 250, 0.35)" }}
              >
                <span className="text-xs font-bold" style={{ color: "#31318A" }}>
                  Oral Fluency Score: 
                </span>
                <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}>
                  {displayScore}
                </span>
              </div>

              {/* Classification Level */}
              <div
                className="flex items-center justify-between rounded px-3 py-1.5"
                style={{ background: classificationColor.bg }}
              >
                <span className="text-xs font-bold" style={{ color: "#31318A" }}>
                  Classification Level: 
                </span>
                <span className="text-[17px] font-semibold" style={{ color: classificationColor.text, fontFamily: "Kanit, sans-serif" }}>
                  {displayClassification}
                </span>
              </div>
            </div>

            {/* View Full Report Button */}
            <div className="mt-2.5 flex justify-center">
              <button
                onClick={() => router.push("/dashboard/oral-reading-test/report")}
                className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: "#6666FF" }}
              >
                View Fluency Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}