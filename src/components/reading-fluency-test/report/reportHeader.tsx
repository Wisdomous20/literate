// src/components/reading-fluency-test/report/reportHeader.tsx
"use client";

import { useState } from "react";
import { LayoutDashboard, ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteConfirmModal } from "@/components/ui/deleteConfirmModal";
import { NavButton } from "@/components/ui/navButton";

const FLUENCY_SESSION_KEY = "reading-fluency-session";
const AUDIO_STORAGE_KEY = "reading-fluency-audio";

interface ReportHeaderProps {
  onExportPdf?: () => void;
}

export default function ReportHeader({ onExportPdf }: ReportHeaderProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleStartNew = () => {
    try {
      sessionStorage.removeItem(FLUENCY_SESSION_KEY);
      sessionStorage.removeItem(AUDIO_STORAGE_KEY);
    } catch {
      /* non-critical */
    }
    router.push("/dashboard/reading-fluency-test");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard size={20} className="text-[#5D5DFB]" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Oral Fluency Test Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full translate-y-1 bg-[#1e3a8a]/30" />
            <button
              type="button"
              onClick={() => onExportPdf?.()}
              disabled={!onExportPdf}
              className="relative inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              Export to PDF
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 bg-[#DE3B40] text-white text-xs font-medium rounded-lg border border-[#DE3B40] hover:bg-[#DE3B40]/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { /* TODO: wire up actual delete handler */ }}
      />

      <div className="flex items-center justify-between px-8 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-[#6666FF]/40 text-[#6666FF] shadow-sm transition-all hover:bg-[#F0F4FF] hover:border-[#6666FF] active:scale-95"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <NavButton variant="outlined" onClick={handleStartNew}>
          <RotateCcw className="h-4 w-4" />
          <span>Start New</span>
        </NavButton>
      </div>
    </div>
  );
}