// src/components/reading-fluency-test/report/reportHeader.tsx
"use client";

import { useState } from "react";
import { LayoutDashboard, ChevronLeft, RotateCcw } from "lucide-react";
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
          <button
            type="button"
            onClick={() => onExportPdf?.()}
            disabled={!onExportPdf}
            className="px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Export to PDF
          </button>
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
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>

        <NavButton variant="outlined" onClick={handleStartNew}>
          <RotateCcw className="h-4 w-4" />
          <span>Start New</span>
        </NavButton>
      </div>
    </div>
  );
}