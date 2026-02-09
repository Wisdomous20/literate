"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { updateClass } from "@/app/actions/class/updateClass";

interface UpdateClassModalProps {
  isOpen: boolean;
  classId: string;
  currentName: string;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export function UpdateClassModal({
  isOpen,
  classId,
  currentName,
  onClose,
  onUpdateSuccess,
}: UpdateClassModalProps) {
  const [className, setClassName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update className when currentName changes
  useEffect(() => {
    setClassName(currentName);
  }, [currentName]);

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setError("Class name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateClass(classId, className);
      if (result.success) {
        onUpdateSuccess?.();
        onClose();
      } else {
        setError(result.error || "Failed to update class");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Update Class</h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            title="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="className"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Class Name
            </label>
            <input
              ref={inputRef}
              id="className"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter class name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-[#6666FF] focus:outline-none focus:ring-2 focus:ring-[#6666FF]/20 disabled:opacity-50"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            type="button"
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={isLoading || className === currentName}
            className="flex items-center gap-2 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#5555DD] disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
