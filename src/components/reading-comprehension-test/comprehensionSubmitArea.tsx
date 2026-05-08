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
    <div className="flex flex-col items-center mt-8 mb-8 gap-2">
      {submitError && (
        <p className="text-red-600 text-sm font-medium">{submitError}</p>
      )}
      {isSubmitted ? (
        onTryAgain ? (
          <div className="relative">
            <div className="absolute inset-0 translate-y-1 rounded-full bg-[#B3A4F1] shadow-[0_4px_16px_rgba(102,102,255,0.18)]" />
              <button
                type="button"
                onClick={onTryAgain}
                className="relative flex items-center justify-center gap-2 rounded-full bg-[#6666FF] px-8 py-3 min-w-[180px] text-base font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow"
              >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        ) : (
          <button
            disabled
            className="relative flex items-center justify-center gap-2 rounded-full bg-[#6666FF] px-8 py-3 min-w-[180px] text-base font-bold text-white opacity-60 shadow"
          >
            Submitted
          </button>
        )
      ) : (
        <div className="relative">
          <div className="absolute inset-0 translate-y-1 rounded-full bg-[#B3A4F1] shadow-[0_4px_16px_rgba(102,102,255,0.18)]" />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="relative flex items-center justify-center gap-2 rounded-full bg-[#6666FF] px-8 py-3 min-w-[180px] text-base font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow disabled:opacity-60"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Submit
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
