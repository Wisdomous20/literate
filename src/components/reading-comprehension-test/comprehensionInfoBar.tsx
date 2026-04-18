import { Clock } from "lucide-react";

interface ComprehensionInfoBarProps {
  totalQuestions: number;
  formattedTime: string;
  isPaused: boolean;
  isSubmitted: boolean;
  onTogglePause: () => void;
}

export function ComprehensionInfoBar({
  totalQuestions,
  formattedTime,
  isPaused,
  isSubmitted,
  onTogglePause,
}: ComprehensionInfoBarProps) {
  return (
    <div className="flex gap-4 shrink-0">
      <div className="flex-1 bg-white border border-[#E0E0FF] rounded-4xl shadow-sm px-8 py-5">
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
        className={`w-58.5 bg-white border rounded-4xl shadow-sm flex items-center justify-center gap-3 shrink-0 transition-all cursor-pointer select-none disabled:cursor-default ${
          isPaused
            ? "border-[#E53E3E] shadow-[0px_1px_20px_rgba(229,62,62,0.07)]"
            : "border-[#E0E0FF]"
        }`}
        title={isPaused ? "Click to resume timer" : "Click to pause timer"}
      >
        <Clock
          className={`w-6 h-6 ${isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`}
        />
        <span
          className={`font-bold text-2xl tabular-nums ${isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`}
        >
          {formattedTime}
        </span>
        {isPaused && (
          <span className="text-[#E53E3E] text-xs font-semibold">PAUSED</span>
        )}
      </button>
    </div>
  );
}