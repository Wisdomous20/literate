"use client";

import {
  Globe,
  BarChart3,
  ClipboardList,
  Link2,
  BookOpen,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PassageFiltersProps {
  language?: string;
  passageLevel?: string;
  testType?: string;
  hasPassage: boolean;
  passageTitle?: string;
  onOpenPassageModal: () => void;
  onShareLink?: () => void;
  showShareLink?: boolean;
  disabled?: boolean;
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "bg-[#EDE9FF] text-[#5D5DFB]"
          : "bg-[#F5F3FF]/60 text-[#9090B4]"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span>{label}</span>
    </div>
  );
}

export function PassageFilters({
  language,
  passageLevel,
  testType,
  hasPassage,
  passageTitle,
  onOpenPassageModal,
  onShareLink,
  showShareLink = false,
  disabled = false,
}: PassageFiltersProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* Left: passage title with icon + filter chips below */}
      <div className="min-w-0 flex-1">
        {/* Passage title row */}
        <div className="mb-2 flex items-center gap-2">
          <BookOpen
            className={`h-4 w-4 shrink-0 ${
              passageTitle ? "text-[#7C3AED]" : "text-[#C4B5FD]"
            }`}
          />
          <span
            className={`truncate text-sm font-bold leading-tight ${
              passageTitle ? "text-[#31318A]" : "text-[#31318A]/35"
            }`}
          >
            {passageTitle || "No passage selected"}
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            icon={Globe}
            label={language ? `${language} Passage` : "Passage Language"}
            active={!!language}
          />
          <FilterChip
            icon={ClipboardList}
            label={testType || "Passage Type"}
            active={!!testType}
          />
          <FilterChip
            icon={BarChart3}
            label={passageLevel || "Passage Level"}
            active={!!passageLevel}
          />
        </div>
      </div>

      {/* Right: shareable link + add passage button */}
      <div className="flex flex-shrink-0 items-center gap-2 pt-0.5">
        {showShareLink && onShareLink && (
          <button
            type="button"
            onClick={onShareLink}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#4F46E5] transition-colors hover:bg-[#EDE9FF] focus:outline-none"
            tabIndex={0}
            aria-label="Share Link"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Share Link</span>
          </button>
        )}
        <div className="relative">
          <div className={`absolute inset-0 rounded-full translate-y-1 ${disabled ? "bg-[#D1D5DB]" : "bg-[#B3A4F1]"}`} />
          <button
            type="button"
            data-tour-target="add-passage-button"
            onClick={disabled ? undefined : onOpenPassageModal}
            disabled={disabled}
            className={`relative flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold shadow transition-transform
      ${
        disabled
          ? "bg-[#9CA3AF] text-white cursor-not-allowed opacity-60 shadow-none"
          : hasPassage
          ? "bg-[#6666FF] text-white hover:bg-[#4F46E5] hover:-translate-y-0.5 active:translate-y-0"
          : "bg-[#4F46E5] text-white hover:bg-[#6666FF] hover:-translate-y-0.5 active:translate-y-0"
      }
    `}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            {hasPassage ? "Change Passage" : "Add Passage"}
          </button>
        </div>
      </div>
    </div>
  );
}
