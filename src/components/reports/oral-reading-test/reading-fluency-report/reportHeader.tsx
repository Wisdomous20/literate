"use client";

import { ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavButton } from "@/components/ui/navButton";

interface ReportHeaderProps {
  onExportPdf?: () => void;
}

export default function ReportHeader({ onExportPdf }: ReportHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar with Export button */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-2xl font-semibold text-[#00306E]">
            Oral Fluency Test Report
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onExportPdf?.()}
          disabled={!onExportPdf}
          className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-lg border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Export to PDF
        </button>
      </div>

      {/* Previous + Continue to Comprehension */}
      <div className="flex items-center justify-between px-8 pt-2">
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>
        <NavButton onClick={() => router.push("/dashboard/oral-reading-test/comprehension")}>
          <span>Continue to Comprehension</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </NavButton>
      </div>
    </div>
  );
}