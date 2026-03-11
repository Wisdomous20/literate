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
  schoolYear: string;
}
export function CreateClassModal({
  isOpen,
  onClose,
  onCreateClass,
  schoolYear,
}: CreateClassModalProps) {
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const MAX_CLASS_NAME_LENGTH = 50;

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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
      if (isLoading) return;

      const trimmedName = className.trim();
      if (!trimmedName) {
        setError("Class name is required");
        return;
      }
      if (trimmedName.length < 2) {
        setError("Class name must be at least 2 characters.");
        return;
      }
      if (trimmedName.length > MAX_CLASS_NAME_LENGTH) {
        setError(
          `Class name must be less than ${MAX_CLASS_NAME_LENGTH} characters.`,
        );
        return;
      }
      if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedName)) {
        setError(
          "Class name can only contain letters, numbers, spaces, hyphens, and underscores.",
        );
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const result = await onCreateClass({
          className: trimmedName,
          schoolYear,
        });

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

  if (typeof window === "undefined" || !isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-99999 flex items-center justify-center">
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in duration-300 bg-black/40 backdrop-blur-[10px]"
      />

      <div
        ref={modalRef}
        className="relative animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="w-125 rounded-[30px] bg-white p-8 shadow-[0px_10px_60px_rgba(0,48,110,0.25)]">
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

          <div className="mb-8">
            <h2 className="text-[28px] font-bold leading-tight text-[#31318A]">
              Create Class
            </h2>
            <p className="mt-1 text-base text-[#00306E]/70">
              Create Class for your students
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center gap-6">
              <label
                htmlFor="className"
                className="w-30 shrink-0 text-base font-semibold text-[#00306E]"
              >
                Class Name
              </label>
              <div className="flex-1 flex flex-col">
                <input
                  id="className"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter class name"
                  maxLength={MAX_CLASS_NAME_LENGTH}
                  className="rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none shadow-[inset_0px_2px_4px_rgba(0,48,110,0.08)] transition-colors focus:border-[#6666FF] disabled:opacity-50"
                />
                <span className="text-right text-xs text-gray-500 mt-2">
                  {className.length}/{MAX_CLASS_NAME_LENGTH}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label
                htmlFor="schoolYear"
                className="w-30 shrink-0 text-base font-semibold text-[#00306E]"
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
