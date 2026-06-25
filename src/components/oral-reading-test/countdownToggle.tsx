"use client";

import { Timer, Minus, Plus } from "lucide-react";

interface CountdownToggleProps {
  countdownEnabled: boolean;
  countdownSeconds: number;
  onToggle: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function CountdownToggle({
  countdownEnabled,
  countdownSeconds,
  onToggle,
  onDecrease,
  onIncrease,
}: CountdownToggleProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Timer className="h-4 w-4 text-[#8B5CF6]" />
      <span className="text-xs font-medium text-[#31318A]">Countdown</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          countdownEnabled ? "Disable countdown" : "Enable countdown"
        }
        title={countdownEnabled ? "Disable countdown" : "Enable countdown"}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors hover:opacity-90 ${
          countdownEnabled ? "bg-[#A78BFA]" : "bg-[#DDD6FE]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            countdownEnabled ? "translate-x-4.25" : "translate-x-0.75"
          }`}
        />
      </button>

      {countdownEnabled && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDecrease}
            aria-label="Decrease countdown seconds"
            title="Decrease countdown seconds"
            className="flex h-5 w-5 items-center justify-center rounded bg-[#F1E8FF] transition-colors hover:opacity-70"
          >
            <Minus className="h-3 w-3 text-[#8B5CF6]" />
          </button>
          <span className="w-5 text-center text-xs font-bold tabular-nums text-[#8B5CF6]">
            {countdownSeconds}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            aria-label="Increase countdown seconds"
            title="Increase countdown seconds"
            className="flex h-5 w-5 items-center justify-center rounded bg-[#F1E8FF] transition-colors hover:opacity-70"
          >
            <Plus className="h-3 w-3 text-[#8B5CF6]" />
          </button>
          <span className="text-[10px] font-medium text-[#31318A]">sec</span>
        </div>
      )}
    </div>
  );
}
