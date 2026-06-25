"use client";

import { Pause, Play, Square } from "lucide-react";

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
  const TimerIcon = isSubmitted ? Square : isPaused ? Pause : Play;

  return (
    <div className="shrink-0 rounded-xl border border-[#DED9FF] bg-[#FCFBFF] px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <h2 className="text-base font-bold text-[#00306E]">
            Questions 1-{totalQuestions}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-[#69738A]">
            Choose the correct answer
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePause}
          disabled={isSubmitted}
          className={
            "flex min-h-10 flex-col items-start justify-center rounded-2xl border border-[#D7D5E8] bg-white px-3 py-1.5 text-[#0F3B79] " +
            "shadow-[0_1px_4px_rgba(15,59,121,0.12)] transition " +
            (isSubmitted ? "cursor-default opacity-70" : "hover:bg-[#EEF3FF]")
          }
          title={isSubmitted ? "Timer stopped" : isPaused ? "Resume timer" : "Pause timer"}
        >
          <span className="flex items-center gap-1.5">
            <TimerIcon
              className={
                "h-4 w-4 " +
                (isSubmitted
                  ? "text-[#64748B]"
                  : isPaused
                    ? "text-[#E53E3E]"
                    : "text-[#6666FF]")
              }
            />
            <span
              className={
                "text-sm font-bold tabular-nums leading-none " +
                (isSubmitted
                  ? "text-[#64748B]"
                  : isPaused
                    ? "text-[#E53E3E]"
                    : "text-[#0F3B79]")
              }
            >
              {formattedTime}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
