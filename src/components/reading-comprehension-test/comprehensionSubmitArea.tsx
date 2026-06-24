"use client";

import { ArrowRight, RotateCcw } from "lucide-react";

interface ComprehensionSubmitAreaProps {
  submitError: string | null;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onSubmit: () => void;
  onTryAgain?: () => void;
}

export function ComprehensionSubmitArea({
  submitError,
  isSubmitting,
  isSubmitted,
  onSubmit,
  onTryAgain,
}: ComprehensionSubmitAreaProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      {submitError && (
        <p className="text-red-600 text-sm font-medium">{submitError}</p>
      )}
      {isSubmitted ? (
        onTryAgain ? (
          <button
            type="button"
            onClick={onTryAgain}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#6666FF] bg-white px-4 text-xs font-semibold text-[#6666FF] transition-colors hover:bg-[#F3F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666FF]/40"
          >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
          </button>
        ) : (
          <button
            disabled
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#6666FF]/50 px-4 text-xs font-semibold text-white"
          >
            Submitted
          </button>
        )
      ) : (
        <div className="relative">
          <div className="absolute inset-0 translate-y-1 rounded-full bg-[#B3A4F1]" />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="relative inline-flex h-9 min-w-32 items-center justify-center gap-1.5 rounded-full bg-[#6666FF] px-4 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666FF]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Submit
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
