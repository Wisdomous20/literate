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
    <div className="flex gap-4 shrink-0">
      <div className="flex-1 bg-[#EFFDFF] border-t border-l border-r-4 border-b-4 border-t-[#5534fa] border-l-[#5534fa] border-r-[#6653F9] border-b-[#6653F9] rounded-4xl shadow-[0px_1px_20px_rgba(65,155,180,0.47)] px-8 py-5">
        <h2 className="text-[#00306E] font-bold text-lg">
          Questions 1-{totalQuestions}
        </h2>
        <p className="text-[#00306E] font-medium text-[15px]">
          Choose the correct answer
        </p>
      </div>
      <button
        onClick={onTogglePause}
        disabled={isSubmitted}
        className={`w-58.5 bg-white rounded-4xl flex items-center justify-center gap-3 shrink-0 transition-all cursor-pointer select-none disabled:cursor-default ${
          isSubmitted
            ? "border-t border-l border-r-4 border-b-4 border-t-[#94A3B8]/60 border-l-[#94A3B8]/60 border-r-[#94A3B8] border-b-[#94A3B8] shadow-[0px_1px_20px_rgba(100,116,139,0.08)]"
            : isPaused
            ? "border-t border-l border-r-4 border-b-4 border-t-[#E53E3E]/60 border-l-[#E53E3E]/60 border-r-[#E53E3E] border-b-[#E53E3E] shadow-[0px_1px_20px_rgba(229,62,62,0.07)]"
            : "border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9]"
        }`}
        title={isSubmitted ? "Timer stopped" : isPaused ? "Resume timer" : "Pause timer"}
      >
        <TimerIcon
          className={`w-6 h-6 ${isSubmitted ? "text-[#64748B]" : isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`}
        />
        <span
          className={`font-bold text-2xl tabular-nums ${isSubmitted ? "text-[#64748B]" : isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`}
        >
          {formattedTime}
        </span>
        {isPaused && !isSubmitted && (
          <span className="text-[#E53E3E] text-xs font-semibold">PAUSED</span>
        )}
      </button>
    </div>
  );
}
