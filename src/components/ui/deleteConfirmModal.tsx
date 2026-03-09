"use client";

import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const titleId = "delete-confirm-modal-title";
const descriptionId = "delete-confirm-modal-description";

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Report?",
  description = "This action cannot be undone. The report and all associated data will be permanently deleted.",
}: DeleteConfirmModalProps) {
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      deleteButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative z-10 mx-4 flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-[#8D8DEC] bg-white p-7 shadow-[0_8px_40px_rgba(102,102,255,0.18)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#DE3B40]/20 bg-[#FFF0F0]">
          <Trash2 className="h-7 w-7 text-[#DE3B40]" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1.5 text-center">
          <h2 id={titleId} className="text-lg font-bold text-[#00306E]">{title}</h2>
          <p id={descriptionId} className="text-sm text-[#00306E]/60">{description}</p>
        </div>

        {/* Buttons */}
        <div className="mt-1 flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#6666FF]/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#6666FF] transition-colors hover:bg-[rgba(102,102,255,0.06)]"
          >
            Cancel
          </button>
          <button
            ref={deleteButtonRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-lg bg-[#DE3B40] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(222,59,64,0.3)] transition-colors hover:bg-[#C8333A]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
