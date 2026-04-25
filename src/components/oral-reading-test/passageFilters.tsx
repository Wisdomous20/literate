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
      className={`flex items-center gap-2 px-1.5 py-1 text-sm font-medium ${
        active ? "text-[#31318A]" : "text-[#00306E]/50"
      }`}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[8px] border-t border-l border-r-2 border-b-2 border-t-[#C7D2FE] border-l-[#C7D2FE] border-r-[#5D5DFB] border-b-[#5D5DFB] bg-[#F3F0FF] shadow-sm"
        style={{ minWidth: 28, minHeight: 28 }}
      >
        <Icon className="h-4 w-4 text-[#5D5DFB]" />
      </span>
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
            tabIndex={0}
            aria-label="Share Link"
          >
            <Link2 className="h-5 w-5 text-[#5D5DFB]" />
            <span>Share Link</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenPassageModal}
          className={`flex items-center justify-center gap-2 rounded-[10px] border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] px-4 py-1.5 text-xs font-medium min-w-[120px] shadow transition-colors
    ${
      hasPassage
        ? "bg-white text-[#6666FF] hover:bg-[#6666FF] hover:text-white"
        : "bg-[#6666FF] text-white hover:bg-[#4F46E5]"
    }
  `}
        >
          {hasPassage ? "Change Passage" : "Add Passage"}
        </button>
      </div>
    </div>
  );
}
