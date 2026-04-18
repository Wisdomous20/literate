"use client";

import { Globe, BarChart3, ClipboardList, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PassageFiltersProps {
  language?: string;
  passageLevel?: string;
  testType?: string;
  hasPassage: boolean;
  onOpenPassageModal: () => void;
  onShareLink?: () => void;
  showShareLink?: boolean;
}

function FilterChip({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "text-[#31318A]" : "text-[#00306E]/50"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          active ? "border-[#6666FF] bg-[#6666FF]" : "border-[#A5A5D6] bg-white"
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <Icon className="h-4 w-4 shrink-0 text-[#5D5DFB]" />
      <span>{label}</span>
    </div>
  );
}

export function PassageFilters({
  language,
  passageLevel,
  testType,
  hasPassage,
  onOpenPassageModal,
  onShareLink,
  showShareLink = false,
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

      <div className="ml-auto flex items-center gap-2">
        {showShareLink && onShareLink && (
          <button
            type="button"
            onClick={onShareLink}
            className="flex items-center gap-1 px-2 py-1 text-sm font-semibold text-[#4F46E5] bg-transparent border-none shadow-none hover:underline hover:bg-transparent focus:outline-none"
            style={{ boxShadow: "none", border: "none" }}
            tabIndex={0}
            aria-label="Share Link"
          >
            <Link2 className="h-4 w-4" />
            <span>Share Link</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenPassageModal}
          className="flex items-center justify-center gap-2 rounded-full bg-[#6666FF] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4F46E5] min-w-[120px]"
        >
          {hasPassage ? "Change Passage" : "Add Passage"}
        </button>
      </div>
    </div>
  );
}
