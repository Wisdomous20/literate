"use client"

import { FileText } from "lucide-react"

interface PassageFiltersProps {
  language?: string
  passageLevel?: string
  testType?: string
  hasPassage: boolean
  onOpenPassageModal: () => void
}

function FilterLabel({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  return (
    <div
      className="flex flex-1 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium"
      style={{
        background: "#D5E7FE",
        border: "1px solid #54A4FF",
        boxShadow: "0px 1px 20px rgba(108, 164, 239, 0.37)",
        color: "#00306E",
      }}
    >
      <FileText className="h-4 w-4 shrink-0 text-[#5D5DFB]" />
      <span className="text-left">{value || label}</span>
    </div>
  )
}

export function PassageFilters({
  language,
  passageLevel,
  testType,
  hasPassage,
  onOpenPassageModal,
}: PassageFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterLabel label="Language (English / Filipino)" value={language} />
      <FilterLabel label="Passage Level" value={passageLevel} />
      <FilterLabel label="Test Type" value={testType} />
      <button
        onClick={onOpenPassageModal}
        className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 md:px-6 md:text-[15px]"
        style={{
          background: "#2E2E68",
          border: "1px solid #7A7AFB",
          boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
        }}
      >
        {hasPassage ? "Change Passage" : "Add Passage"}
      </button>
    </div>
  )
}
