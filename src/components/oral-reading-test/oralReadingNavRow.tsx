"use client";

import { ChevronLeft } from "lucide-react";

interface OralReadingNavRowProps {
  onGoBack: () => void;
  onContinue: () => void;
  continueEnabled: boolean;
}

export function OralReadingNavRow({
  onGoBack,
  onContinue,
  continueEnabled,
}: OralReadingNavRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border-t border-l border-r-2 border-b-2 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-[#F3F0FF] px-4 py-3 shadow-[0px_2px_16px_rgba(108,164,239,0.18)]">
      {" "}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-3xl border-t border-l border-r-2 border-b- border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white transition-colors hover:bg-[#5555EE]"
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
            Details
          </p>
          <p className="text-sm font-semibold text-[#1E1B4B]">
            Student Information
          </p>
        </div>
      </div>
      {/* Right: Comprehension Test button */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!continueEnabled}
        className={`flex items-center gap-2 rounded-[20px] border-t border-l border-r-3 border-b-3 px-5 py-2 text-sm font-semibold transition-all ${
          continueEnabled
            ? "border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] bg-[#6666FF] text-white shadow-[0_2px_12px_rgba(102,102,255,0.35)] hover:bg-[#5555EE]"
            : "cursor-not-allowed border-t-[#A855F7]/30 border-l-[#A855F7]/30 border-r-[#C4C4FF] border-b-[#C4C4FF] bg-white text-[#A5A5D6]"
        }`}
      >
        <span>Comprehension Test</span>
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
            continueEnabled ? "border-white" : "border-[#C4C4FF]"
          }`}
        >
          {continueEnabled && (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          )}
        </span>
      </button>
    </div>
  );
}
