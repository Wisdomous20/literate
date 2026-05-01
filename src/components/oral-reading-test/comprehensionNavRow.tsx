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
      <button
        type="button"
        onClick={onGoBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.35)] transition-all hover:bg-[#5555EE] hover:shadow-[0_6px_16px_rgba(102,102,255,0.45)] active:scale-95"
        aria-label="Go back"
        title="Go back"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <NavButton onClick={onContinue} disabled={!continueEnabled}>
        <span>{continueLabel}</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </NavButton>
    </div>
  );
}
