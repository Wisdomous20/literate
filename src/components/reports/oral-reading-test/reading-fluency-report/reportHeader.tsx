// src/components/reports/oral-reading-test/reading-fluency-report/reportHeader.tsx
"use client";

import { ArrowLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavButton } from "@/components/ui/navButton";

interface ReportHeaderProps {
  onExportPdf?: () => void;
  assessmentId?: string | null;
}

export default function ReportHeader({
  onExportPdf,
  assessmentId,
}: ReportHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex h-16 md:h-17.5 items-center justify-between border-b-[3px] border-[#5D5DFB] bg-white px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-[#5D5DFB]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-semibold text-[#483efa]">
              Oral Fluency Test Report
            </h1>
            {assessmentId && (
              <p className="text-[11px] md:text-xs font-medium text-[#2E2E68]/65">
                Assessment ID:{" "}
                <span className="font-semibold text-[#2E2E68]">
                  {assessmentId}
                </span>
              </p>
            )}
          </div>
        </div>
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
      </header>

      <div className="flex items-center justify-between px-4 md:px-6 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-[#6666FF]/40 text-[#6666FF] shadow-sm transition-all hover:bg-[#F0F4FF] hover:border-[#6666FF] active:scale-95"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <NavButton onClick={() => router.push("/dashboard/oral-reading-test/comprehension")}>
          <span>Continue to Comprehension</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </NavButton>
      </div>
    </div>
  );
}
