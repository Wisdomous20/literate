"use client";

import { Clock } from "lucide-react";

interface ComprehensionInfoBarProps {
  totalQuestions: number;
  formattedTime: string;
  isPaused: boolean;
  onTogglePause: () => void;
  isSubmitted: boolean;
}

export function ComprehensionInfoBar({
  totalQuestions,
  formattedTime,
  isPaused,
  onTogglePause,
  isSubmitted,
}: ComprehensionInfoBarProps) {
  return (
    <div className="shrink-0 rounded-xl border border-[#C9C8FF] bg-white px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <h2 className="text-[18px] font-bold text-[#00306E]">
            Questions 1-{totalQuestions}
          </h2>
          <p className="mt-0.5 text-[13px] font-medium text-[#88A0C4]">
            Choose the correct answer
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePause}
          disabled={isSubmitted}
          className={
            "flex h-8 items-center gap-2 rounded-full border border-[#C9C8FF] bg-[#F5F8FF] px-4 text-[#0F3B79] " +
            "shadow-[0_1px_4px_rgba(15,59,121,0.12)] transition " +
            (isSubmitted ? "cursor-default opacity-70" : "hover:bg-[#EEF3FF]")
          }
          title={isPaused ? "Click to resume timer" : "Click to pause timer"}
        >
          <Clock
            className={
              "h-4 w-4 " + (isPaused ? "text-[#E53E3E]" : "text-[#6666FF]")
            }
          />
          <span
            className={
              "text-[18px] font-bold tabular-nums leading-none " +
              (isPaused ? "text-[#E53E3E]" : "text-[#0F3B79]")
            }
          >
            {formattedTime}
          </span>
        </button>
      </div>
    </div>
  );
}
