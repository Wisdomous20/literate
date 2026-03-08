"use client"

import { Globe, BarChart3, ClipboardList, type LucideIcon } from "lucide-react"

interface PassageFiltersProps {
  language?: string
  passageLevel?: string
  testType?: string
  hasPassage: boolean
  onOpenPassageModal: () => void
}

function FilterLabel({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value?: string
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-medium shadow-[0px_1px_20px_rgba(108,164,239,0.37)] ${
        value
          ? "border-[#6666FF] bg-[#EEEEFF] text-[#31318A]"
          : "border-[#54A4FF] bg-[#D5E7FE] text-[#00306E]/50"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#5D5DFB]" />
      <span className="text-left">
        <span className="text-[#00306E]/60 font-normal">{label}:</span>{" "}
        <span className={value ? "font-semibold text-[#31318A]" : "italic text-[#00306E]/35"}>{value || "—"}</span>
      </span>
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
      <FilterLabel icon={Globe} label="Language" value={language} />
      <FilterLabel icon={BarChart3} label="Passage Level" value={passageLevel} />
      <FilterLabel icon={ClipboardList} label="Test Type" value={testType} />
     <button
  type="button"
  onClick={onOpenPassageModal}
  className="shrink-0 rounded-lg border border-[#7A7AFB] bg-[#2E2E68] px-4 py-2 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-colors hover:opacity-90 md:px-6 md:text-[15px]"
>
  {hasPassage ? "Change Passage" : "Add Passage"}
</button>
    </div>
  )
}
