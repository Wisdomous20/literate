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
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4" style={{ color: "#6666FF" }} />
      <span className="text-xs font-medium text-[#31318A]">Countdown</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          countdownEnabled ? "Disable countdown" : "Enable countdown"
        }
        title={countdownEnabled ? "Disable countdown" : "Enable countdown"}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          countdownEnabled ? "bg-[#6666FF]" : "bg-[#C4C4FF]"
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
            className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70"
          >
            <Minus className="h-3 w-3 text-[#6666FF]" />
          </button>
          <span className="w-5 text-center text-xs font-bold tabular-nums text-[#6666FF]">
            {countdownSeconds}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            aria-label="Increase countdown seconds"
            title="Increase countdown seconds"
            className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(102,102,255,0.15)] transition-colors hover:opacity-70"
          >
            <Plus className="h-3 w-3 text-[#6666FF]" />
          </button>
          <span className="text-[10px] font-medium text-[#31318A]">sec</span>
        </div>
      )}
    </div>
  );
}
