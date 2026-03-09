"use client";

import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { NavButton } from "@/components/ui/navButton";

export default function ComprehensionReportHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-2xl font-semibold text-[#00306E]">
            Reading Comprehension Test Report
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-lg border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {/* Previous + Reading Level */}
      <div className="flex items-center justify-between px-8 pt-2">
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>

        <NavButton
          onClick={() =>
            router.push("/dashboard/oral-reading-test/reading-level-report")
          }
        >
          <span>Reading Level</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </NavButton>
      </div>
    </div>
  );
}
