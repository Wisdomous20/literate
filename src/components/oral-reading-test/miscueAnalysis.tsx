"use client"

import { MoreVertical } from "lucide-react"

interface MiscueItem {
  label: string
  count: number
  color: string
  textColor: string
}

const miscueItems: MiscueItem[] = [
  { label: "Mispronunciation", count: 0, color: "rgba(253, 182, 210, 0.44)", textColor: "#C41048" },
  { label: "Omission", count: 0, color: "rgba(180, 170, 240, 0.4)", textColor: "#4B3BA3" },
  { label: "Substitutions", count: 0, color: "rgba(160, 200, 255, 0.4)", textColor: "#1A5FB4" },
  { label: "Transposition", count: 0, color: "rgba(255, 180, 200, 0.35)", textColor: "#B4365A" },
  { label: "Reversal", count: 0, color: "rgba(200, 165, 130, 0.35)", textColor: "#6E4023" },
  { label: "Insertion", count: 0, color: "rgba(140, 220, 160, 0.4)", textColor: "#1E7A35" },
  { label: "Repetition", count: 0, color: "rgba(255, 200, 140, 0.45)", textColor: "#B85C00" },
  { label: "Self-Correction", count: 0, color: "rgba(250, 230, 140, 0.45)", textColor: "#8A6D00" },
]

interface MiscueAnalysisProps {
  totalMiscue?: number
  oralFluencyScore?: string
  classificationLevel?: string
}

export function MiscueAnalysis({
  totalMiscue = 0,
  oralFluencyScore = "--",
  classificationLevel = "--",
}: MiscueAnalysisProps) {
  return (
    <div
      className="flex h-full flex-col justify-between rounded-[10px] px-5 py-4"
      style={{
        background: "#EFFDFF",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
      }}
    >
      {/* Top section: Title + Miscue Items */}
      <div>
        {/* Title */}
        <h3
          className="mb-2 text-[15px] font-bold"
          style={{ color: "#003366" }}
        >
          Miscue Analysis
        </h3>

        {/* Miscue Items List */}
        <div className="flex flex-col">
          {miscueItems.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  {/* Color-coded count badge */}
                  <div
                    className="flex h-6 w-7 items-center justify-center rounded-[5px] text-sm font-bold"
                    style={{
                      background: item.color,
                      border: "1px solid #DAE6FF",
                      color: item.textColor,
                    }}
                  >
                    {item.count}
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
              {/* Divider (not after the last item) */}
              {index < miscueItems.length - 1 && (
                <div
                  className="h-px"
                  style={{ background: "rgba(18, 48, 220, 0.25)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section: Results + Button */}
      <div className="pt-2">
        {/* Results Section */}
        <div className="flex flex-col gap-1.5">
          {/* Total Miscue */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "rgba(237, 232, 234, 0.69)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Total Miscue
            </span>
            <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}>
              {totalMiscue}
            </span>
          </div>

          {/* Oral Fluency Score */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "#EFFAED" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Oral Fluency Score
            </span>
            <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}>
              {oralFluencyScore}
            </span>
          </div>

          {/* Classification Level */}
          <div
            className="flex items-center justify-between rounded px-3 py-1.5"
            style={{ background: "#DFFDEA" }}
          >
            <span className="text-xs font-bold" style={{ color: "#31318A" }}>
              Classification Level
            </span>
            <span className="text-[17px] font-semibold" style={{ color: "#2E2EA3", fontFamily: "Kanit, sans-serif" }}>
              {classificationLevel}
            </span>
          </div>
        </div>

        {/* View Full Report Button */}
        <div className="mt-2.5 flex justify-center">
          <button
            className="rounded-[5px] px-5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:opacity-90"
            style={{
              background: "#2E2E68",
              border: "1px solid #0C1A6D",
              boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
            }}
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  )
}