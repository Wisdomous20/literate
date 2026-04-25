"use client";

import { ChevronLeft, X } from "lucide-react";

interface OralReadingNavRowProps {
  onGoBack: () => void;
  onContinue: () => void;
  continueEnabled: boolean;
  onClear: () => void;
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
  hasPassage: boolean;
  continueLabel?: string;
}

export function OralReadingNavRow({
  onGoBack,
  onContinue,
  continueEnabled,
  onClear,
  studentName,
  gradeLevel,
  selectedClassName,
  hasPassage,
  continueLabel = "Comprehension Test",
}: OralReadingNavRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-[#F3F0FF] px-4 py-2.5 shadow-[0px_2px_16px_rgba(108,164,239,0.18)]">
      {/* Left: back button + student info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onGoBack}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-3xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white transition-colors hover:bg-[#5555EE]"
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {hasPassage ? (
          /* Layout 2: class name (small label) + student name · grade */
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex flex-col leading-tight flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] whitespace-nowrap">
                {selectedClassName || "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-[#A855F7]/30 flex-shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-[#1E1B4B] truncate">
                {studentName || "—"}
              </span>
              {gradeLevel && (
                <>
                  <span className="text-xs text-[#A855F7]/50 flex-shrink-0">
                    ·
                  </span>
                  <span className="text-xs font-medium text-[#6B7280] flex-shrink-0 whitespace-nowrap">
                    {gradeLevel}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Layout 1: student name · grade · class as compact inline text */
          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <span className="font-semibold text-[#1E1B4B] truncate">
              {studentName || (
                <span className="font-normal text-[#A5A5D6]">Student Name</span>
              )}
            </span>
            <span className="text-[#A855F7]/40 flex-shrink-0">·</span>
            <span className="text-[#6B7280] flex-shrink-0 whitespace-nowrap">
              {gradeLevel || <span className="text-[#A5A5D6]">Grade</span>}
            </span>
            <span className="text-[#A855F7]/40 flex-shrink-0">·</span>
            <span className="text-[#6B7280] flex-shrink-0 whitespace-nowrap">
              {selectedClassName || (
                <span className="text-[#A5A5D6]">Class</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasPassage && (
          <button
            type="button"
            onClick={onContinue}
            disabled={!continueEnabled}
            className={`flex items-center gap-2 rounded-[20px] border-t border-l border-r-[3px] border-b-[3px] px-4 py-1.5 text-sm font-semibold transition-all ${
              continueEnabled
                ? "border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white shadow-[0_2px_12px_rgba(102,102,255,0.35)] hover:bg-[#5555EE]"
                : "cursor-not-allowed border-t-[#A855F7]/30 border-l-[#A855F7]/30 border-r-[#C4C4FF] border-b-[#C4C4FF] bg-white text-[#A5A5D6]"
            }`}
          >
            <span>{continueLabel}</span>
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                continueEnabled ? "border-white" : "border-[#C4C4FF]"
              }`}
            >
              {continueEnabled && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg border border-[#A855F7]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#6666FF] transition-colors hover:bg-[#F3F0FF] hover:border-[#A855F7]/60"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
