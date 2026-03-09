"use client"

import { useMemo } from "react"
import { Loader2, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import type { MiscueResult } from "@/types/oral-reading"

const MISCUE_CONFIG = [
  {
    key: "MISPRONUNCIATION",
    label: "Mispronunciation",
    colorClass: "bg-[rgba(253,182,210,0.44)]",
    activeClass: "bg-[rgba(253,182,210,0.18)]",
    textClass: "text-[#C41048]",
  },
  {
    key: "OMISSION",
    label: "Omission",
    colorClass: "bg-[rgba(180,170,240,0.4)]",
    activeClass: "bg-[rgba(180,170,240,0.18)]",
    textClass: "text-[#4B3BA3]",
  },
  {
    key: "SUBSTITUTION",
    label: "Substitution",
    colorClass: "bg-[rgba(160,200,255,0.4)]",
    activeClass: "bg-[rgba(160,200,255,0.18)]",
    textClass: "text-[#1A5FB4]",
  },
  {
    key: "TRANSPOSITION",
    label: "Transposition",
    colorClass: "bg-[rgba(220,120,220,0.4)]",
    activeClass: "bg-[rgba(220,120,220,0.18)]",
    textClass: "text-[#8B008B]",
  },
  {
    key: "REVERSAL",
    label: "Reversal",
    colorClass: "bg-[rgba(200,165,130,0.35)]",
    activeClass: "bg-[rgba(200,165,130,0.18)]",
    textClass: "text-[#6E4023]",
  },
  {
    key: "INSERTION",
    label: "Insertion",
    colorClass: "bg-[rgba(140,220,160,0.4)]",
    activeClass: "bg-[rgba(140,220,160,0.18)]",
    textClass: "text-[#1E7A35]",
  },
  {
    key: "REPETITION",
    label: "Repetition",
    colorClass: "bg-[rgba(255,200,140,0.45)]",
    activeClass: "bg-[rgba(255,200,140,0.18)]",
    textClass: "text-[#B85C00]",
  },
  {
    key: "SELF_CORRECTION",
    label: "Self-Correction",
    colorClass: "bg-[rgba(250,230,140,0.45)]",
    activeClass: "bg-[rgba(250,230,140,0.18)]",
    textClass: "text-[#8A6D00]",
  },
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
  onExportPdf?: () => void
}

function getClassificationClasses(level?: string): {
  textClass: string
  bgClass: string
} {
  switch (level?.toUpperCase()) {
    case "INDEPENDENT":
      return { textClass: "text-[#1E7A35]", bgClass: "bg-[rgba(140,220,160,0.3)]" }
    case "INSTRUCTIONAL":
      return { textClass: "text-[#1A5FB4]", bgClass: "bg-[rgba(160,200,255,0.3)]" }
    case "FRUSTRATION":
      return { textClass: "text-[#C41048]", bgClass: "bg-[rgba(253,182,210,0.3)]" }
    default:
      return { textClass: "text-[#2E2EA3]", bgClass: "bg-[rgba(230,230,250,0.2)]" }
  }
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
  onExportPdf,
}: MiscueAnalysisProps) {
  const router = useRouter()

  const miscueCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of miscues) {
      counts[m.miscueType] = (counts[m.miscueType] || 0) + 1
    }
    return counts
  }, [miscues])

  const hasResults =
    miscues.length > 0 || (totalMiscue !== undefined && totalMiscue > 0)

  const displayTotalMiscue =
    totalMiscue ??
    (hasResults ? miscues.filter((m) => !m.isSelfCorrected).length : 0)

  const displayScore =
    oralFluencyScore !== undefined
      ? typeof oralFluencyScore === "number"
        ? `${oralFluencyScore}%`
        : oralFluencyScore
      : "--"

  const displayClassification = classificationLevel || "--"
  const classificationClasses = getClassificationClasses(classificationLevel)

  return (
    <div
      className={`flex h-full flex-col rounded-[10px] border border-[#54A4FF] bg-[#EFFDFF] px-5 py-4 shadow-[0px_1px_20px_rgba(108,164,239,0.37)] transition-opacity duration-300 ${
        disabled && !isAnalyzing
          ? "pointer-events-none opacity-60"
          : "opacity-100"
      }`}
    >
      {/* Title */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6666FF]">
          Miscue Analysis
        </span>
        <button
          type="button"
          title="Download as PDF"
          onClick={onExportPdf}
          className="rounded p-0.5 text-[#6666FF] transition-colors hover:bg-[rgba(102,102,255,0.1)]"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Loading state while analyzing */}
      {isAnalyzing ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
          <span className="text-sm font-medium text-[#31318A]">
            Analyzing reading fluency...
          </span>
          <span className="text-xs text-[#31318A]/60">This may take a moment</span>
        </div>
      ) : (
        <>
          {/* Miscue Items List */}
          <div className="flex flex-1 flex-col">
            {MISCUE_CONFIG.map((item, index) => {
              const isActive = highlightedTypes.has(item.key)
              const count = miscueCounts[item.key] || 0

              return (
                <div key={item.key}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-md px-1.5 py-1.5 transition-colors ${
                      isActive ? item.activeClass : "bg-transparent"
                    }`}
                    onClick={() => onToggleHighlight?.(item.key)}
                  >
                    {/* Left: count badge */}
                    <div
                      className={`flex h-6 w-7 shrink-0 items-center justify-center rounded-[5px] border border-[#DAE6FF] text-sm font-bold ${item.colorClass} ${item.textClass}`}
                    >
                      {count}
                    </div>
                    {/* Right: label */}
                    <span className={`text-sm font-bold ${item.textClass}`}>
                      {item.label}
                    </span>
                  </button>

                  {/* Divider */}
                  {index < MISCUE_CONFIG.length - 1 && (
                    <div className="h-px bg-[rgba(18,48,220,0.25)]" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-2">
            <div className="flex flex-col gap-1.5">
              {/* Total Miscue */}
              <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.5)] px-3 py-1.5">
                <span className="text-xs font-bold text-[#31318A]">
                  Total Miscue:
                </span>
                <span className="text-[17px] font-semibold text-[#2E2EA3] font-[Kanit,sans-serif]">
                  {displayTotalMiscue}
                </span>
              </div>

              {/* Oral Fluency Score */}
              <div className="flex items-center justify-between rounded bg-[rgba(230,230,250,0.35)] px-3 py-1.5">
                <span className="text-xs font-bold text-[#31318A]">
                  Oral Fluency Score:
                </span>
                <span className="text-[17px] font-semibold text-[#2E2EA3] font-[Kanit,sans-serif]">
                  {displayScore}
                </span>
              </div>

              {/* Classification Level */}
              <div
                className={`flex items-center justify-between rounded px-3 py-1.5 ${classificationClasses.bgClass}`}
              >
                <span className="text-xs font-bold text-[#31318A]">
                  Classification Level:
                </span>
                <span
                  className={`text-[17px] font-semibold font-[Kanit,sans-serif] ${classificationClasses.textClass}`}
                >
                  {displayClassification}
                </span>
              </div>
            </div>

            {/* View Full Report Button */}
            <div className="mt-2.5 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/dashboard/reading-fluency-test/report")}
                className="mt-3 w-full rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
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