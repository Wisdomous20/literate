"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (data: {
    className: string;
    schoolYear: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

// Helper to get current school year (e.g., "2026-2027")
function getCurrentSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January)

  // If it's August or later, the school year starts this year
  // Otherwise, the school year started last year
  if (currentMonth >= 7) {
    // August onwards
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

export function CreateClassModal({
  isOpen,
  onClose,
  onCreateClass,
}: CreateClassModalProps) {
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schoolYear = getCurrentSchoolYear(); // Auto-filled and read-only
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setClassName("");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!className.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await onCreateClass({ className, schoolYear });

        if (result.success) {
          setClassName("");
          onClose();
        } else {
          setError(result.error || "Failed to create class");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [className, schoolYear, onCreateClass, onClose, isLoading],
  );

  // Don't render on server or when closed
  if (typeof window === "undefined" || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in duration-300 bg-black/40 backdrop-blur-[10px]"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="w-[500px] rounded-[30px] bg-white p-8 shadow-[0px_10px_60px_rgba(0,48,110,0.25)]">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close create class modal"
            title="Close"
            className="absolute right-6 top-6 text-[#00306E]/50 transition-colors hover:text-[#00306E] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold leading-tight text-[#31318A]">
              Create Class
            </h2>
            <p className="mt-1 text-base text-[#00306E]/70">
              Create Class for your students
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Class Name */}
            <div className="flex items-center gap-6">
              <label
                htmlFor="className"
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                Class Name
              </label>
              <input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isLoading}
                placeholder="Enter class name"
                className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)] transition-colors focus:border-[#6666FF] disabled:opacity-50"
              />
            </div>

            {/* School Year */}
            <div className="flex items-center gap-6">
              <label
                htmlFor="schoolYear"
                className="w-[120px] shrink-0 text-base font-semibold text-[#00306E]"
              >
                School Year
              </label>
              <input
                id="schoolYear"
                value={schoolYear}
                readOnly
                className="flex-1 cursor-not-allowed rounded-lg border-2 border-[#E4F4FF] bg-[#F8FAFC] px-4 py-3 text-base text-[#00306E]/70 shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)] outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isLoading || !className.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#2E2E68] px-10 py-3 text-base font-semibold text-white shadow-[0px_4px_15px_rgba(46,46,104,0.4)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
