"use client";

import { LayoutDashboard, ChevronLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavButton } from "@/components/ui/navButton";

interface ReadingComprehensionReportHeaderProps {
  onExportPdf?: () => void;
}

export default function ReadingComprehensionReportHeader({ onExportPdf }: ReadingComprehensionReportHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex h-16 md:h-17.5 items-center justify-between border-b-[3px] border-[#5D5DFB] bg-white px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-[#5D5DFB]" />
          </div>
          <h1 className="text-base md:text-lg font-semibold text-[#483efa]">
            Reading Comprehension Test Report
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
        </div>
      </header>

      <div className="flex items-center justify-between px-4 md:px-6 pt-2">
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>
        <NavButton
          variant="outlined"
          onClick={() => {
            sessionStorage.removeItem("reading-comprehension-session");
            sessionStorage.removeItem("reading-comprehension-comp-state");
            sessionStorage.removeItem("reading-comprehension-assessmentId");
            router.push("/dashboard/reading-comprehension-test");
          }}
        >
          <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
          <span>Start New</span>
        </NavButton>
      </div>
    </div>
  );
}