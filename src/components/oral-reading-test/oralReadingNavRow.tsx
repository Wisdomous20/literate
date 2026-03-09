"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onGoBack}
        className="flex items-center gap-1 text-sm font-semibold text-[#00306E] transition-colors hover:text-[#6666FF] md:text-base lg:text-lg"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        <span>Previous</span>
      </button>

      <h2 className="flex-1 text-center text-base font-bold text-[#0C1A6D] md:text-lg lg:text-xl">
        Student Information
      </h2>

      <button
        type="button"
        onClick={onContinue}
        aria-label="Continue to comprehension"
        title="Continue to comprehension"
        className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 md:text-base ${
          continueEnabled
            ? "animate-[pulseGlow_2s_ease-in-out_infinite] bg-[#6666FF] text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] hover:bg-[#5555EE]"
            : "cursor-not-allowed text-[#00306E]/40"
        }`}
        disabled={!continueEnabled}
      >
        <span>Continue to Comprehension</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </button>
    </div>
  );
}
