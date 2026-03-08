interface ComprehensionSubmitAreaProps {
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

export function ComprehensionSubmitArea({
  isSubmitting,
  isSubmitted,
  submitError,
  onSubmit,
}: ComprehensionSubmitAreaProps) {
  return (
    <div className="flex flex-col items-center mt-8 mb-8 gap-2">
      {submitError && (
        <p className="text-red-600 text-sm font-medium">{submitError}</p>
      )}
      <button
        onClick={onSubmit}
        disabled={isSubmitting || isSubmitted}
        className="w-56.25 h-15.75 bg-[#2E2E68] border border-[#7A7AFB] rounded-lg shadow-[0px_1px_20px_rgba(65,155,180,0.47)] text-white font-semibold text-xl hover:bg-[#2E2E68]/90 transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"}
      </button>
    </div>
  );
}
