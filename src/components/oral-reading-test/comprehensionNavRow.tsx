"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ComprehensionNavRowProps {
  onGoBack: () => void;
  onContinue: () => void;
  continueEnabled: boolean;
  continueLabel?: string;
}

export function ComprehensionNavRow({
  onGoBack,
  onContinue,
  continueEnabled,
  continueLabel = "Reading Level",
}: ComprehensionNavRowProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onGoBack}
        className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        <span>Previous</span>
      </button>
      <button
        onClick={onContinue}
        disabled={!continueEnabled}
        className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
      >
        <span>{continueLabel}</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </button>
    </div>
  );
}
