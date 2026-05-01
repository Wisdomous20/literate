"use client";

import { ArrowRight, RotateCcw } from "lucide-react";

interface ComprehensionSubmitAreaProps {
  submitError: string | null;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onSubmit: () => void;
  onTryAgain?: () => void;
  onReadingLevel?: () => void;
  canViewReadingLevel?: boolean;
}

export function ComprehensionSubmitArea({
  submitError,
  isSubmitting,
  isSubmitted,
  onSubmit,
  onTryAgain,
  onReadingLevel,
  canViewReadingLevel = false,
}: ComprehensionSubmitAreaProps) {
  return (
    <div className="mt-8 mb-8 flex flex-col items-center gap-2">
      {submitError && (
        <p className="text-sm font-medium text-red-600">{submitError}</p>
      )}

      {isSubmitted ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {onTryAgain && (
            <div className="relative">
              <div className="absolute inset-0 translate-y-1 rounded-full bg-[#B3A4F1] shadow-[0_4px_24px_rgba(102,102,255,0.18)]" />
              <button
                type="button"
                onClick={onTryAgain}
                className="relative flex items-center gap-2 rounded-full bg-[#6666FF] px-7 py-3 text-base font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow"
              >
                <RotateCcw className="h-5 w-5" />
                Try Again
              </button>
            </div>
          )}

          {onReadingLevel && (
            <div className="relative">
              <div
                className={`absolute inset-0 translate-y-1 rounded-full ${canViewReadingLevel ? "bg-[#B3A4F1]" : "bg-[#D4D4F0]"} shadow-[0_4px_24px_rgba(102,102,255,0.18)]`}
              />
              <button
                type="button"
                onClick={onReadingLevel}
                disabled={!canViewReadingLevel}
                className={`relative flex items-center gap-2 rounded-full px-7 py-3 text-base font-bold transition-transform shadow border-t-2 ${
                  canViewReadingLevel
                    ? "border-t-[#A855F7] bg-white text-[#3B21CC] hover:bg-[#6666FF] hover:text-white"
                    : "cursor-not-allowed border-t-[#D4D4F0] bg-[#C4C4FF] text-white"
                } ${canViewReadingLevel ? "hover:-translate-y-0.5 active:translate-y-0" : ""}`}
              >
                Reading Level
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 translate-y-1 rounded-full bg-[#B3A4F1] shadow-[0_4px_24px_rgba(102,102,255,0.18)]" />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="relative flex items-center justify-center gap-2 rounded-full bg-[#6666FF] px-10 py-3 text-base font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow disabled:opacity-60 min-w-[220px]"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
