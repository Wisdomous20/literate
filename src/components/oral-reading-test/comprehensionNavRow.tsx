"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { NavButton } from "@/components/ui/navButton";

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
      <div className="relative">
        <div className="absolute inset-0 rounded-full translate-y-1 bg-[#B3A4F1]" />
        <button
          type="button"
          onClick={onGoBack}
          className="relative flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 px-4 py-2 text-xs font-semibold shadow-sm transition-transform bg-white text-[#6666FF] hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          Back
        </button>
      </div>
      <NavButton onClick={onContinue} disabled={!continueEnabled}>
        <span>{continueLabel}</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </NavButton>
    </div>
  );
}
