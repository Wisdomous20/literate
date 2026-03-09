"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavButton } from "@/components/ui/navButton";

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
      <NavButton onClick={onGoBack}>
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        <span>Previous</span>
      </NavButton>

      <h2 className="flex-1 text-center text-base font-bold text-[#0C1A6D] md:text-lg lg:text-xl">
        Student Information
      </h2>

      <NavButton
        onClick={onContinue}
        aria-label="Continue to comprehension"
        title="Continue to comprehension"
        className={
          continueEnabled
            ? "animate-[pulseGlow_2s_ease-in-out_infinite]"
            : "cursor-not-allowed bg-transparent text-[#00306E]/40 shadow-none hover:bg-transparent"
        }
        disabled={!continueEnabled}
      >
        <span>Continue to Comprehension</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </NavButton>
    </div>
  );
}
