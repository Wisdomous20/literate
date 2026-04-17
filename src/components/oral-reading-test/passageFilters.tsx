"use client"

import { Globe, BarChart3, ClipboardList } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface PassageFiltersProps {
  language?: string
  passageLevel?: string
  testType?: string
  hasPassage: boolean
  onOpenPassageModal: () => void
}

function FilterChip({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon
  label: string
  active: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "text-[#31318A]"
          : "text-[#00306E]/50"
      }`}
    >
      {/* Checkbox */}
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          active
            ? "border-[#6666FF] bg-[#6666FF]"
            : "border-[#A5A5D6] bg-white"
        }`}
      >
        {active && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <Icon className="h-4 w-4 shrink-0 text-[#5D5DFB]" />
      <span>{label}</span>
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
    <div className="flex flex-wrap items-center gap-4">
      <FilterChip
        icon={Globe}
        label={language ? `${language} Passage` : "English Passage"}
        active={!!language}
      />
      <FilterChip
        icon={ClipboardList}
        label={testType || "Pre-Test"}
        active={!!testType}
      />
      <FilterChip
        icon={BarChart3}
        label={passageLevel || "Level 3"}
        active={!!passageLevel}
      />

      <div className="ml-auto">
        <button
          type="button"
          onClick={onOpenPassageModal}
          className="shrink-0 rounded-lg border border-[#7A7AFB] bg-[#2E2E68] px-4 py-2 text-sm font-semibold text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-colors hover:opacity-90 md:px-6 md:text-[15px]"
        >
          {hasPassage ? "Change Passage" : "Add Passage"}
        </button>
      </div>
    </div>
  )
}