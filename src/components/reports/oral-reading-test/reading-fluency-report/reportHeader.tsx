"use client";

import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar with Export & Delete buttons */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-2xl font-semibold text-[#00306E]">
            Oral Fluency Test Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-lg border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
          <button
            type="button"
            className="px-5 py-2 bg-[#DE3B40] text-white text-xs font-medium rounded-lg border border-[#DE3B40] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#DE3B40]/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Previous + Continue to Comprehension */}
      <div className="flex items-center justify-between px-8 pt-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[#31318A] font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={24} />
          Previous
        </button>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/oral-reading-test/comprehension")
          }
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] transition-all duration-300 hover:bg-[#5555EE] md:text-base animate-[pulseGlow_2s_ease-in-out_infinite]"
        >
          <span>Continue to Comprehension</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  );
}
