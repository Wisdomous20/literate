"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <NavButton onClick={onGoBack}>
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        <span>Previous</span>
      </NavButton>
      <NavButton onClick={onContinue} disabled={!continueEnabled}>
        <span>{continueLabel}</span>
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </NavButton>
    </div>
  );
}
