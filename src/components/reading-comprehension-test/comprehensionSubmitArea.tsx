"use client";

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
          <button
            onClick={onTryAgain}
            className="w-56.25 h-15.75 bg-[#6666FF] border border-[#7A7AFB] rounded-lg shadow-[0_0_20px_rgba(102,102,255,0.35)] text-white font-semibold text-xl hover:bg-[#5555EE] transition-colors"
          >
            Try Again
          </button>
        ) : (
          <button
            disabled
            className="w-56.25 h-15.75 bg-[#6666FF] border border-[#7A7AFB] rounded-lg shadow-[0_0_20px_rgba(102,102,255,0.35)] text-white font-semibold text-xl transition-colors disabled:opacity-60"
          >
            Submitted
          </button>
        )
      ) : (
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-56.25 h-15.75 bg-[#6666FF] rounded-lg border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#3B21CC] border-b-[#3B21CC] shadow-[0_0_20px_rgba(102,102,255,0.35)] text-white font-semibold text-xl hover:bg-[#5555EE] transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      )}
    </div>
  );
}
