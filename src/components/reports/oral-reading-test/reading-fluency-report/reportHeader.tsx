"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

export default function ReportHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col">
      <DashboardHeader
        title="Oral Fluency Test Report"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-[#54A4FF] bg-[#297CEC] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#297CEC]/90"
            >
              Export to PDF
            </button>
          </div>
        }
      />
      <div className="flex items-center justify-between px-6 pt-4 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={() => router.push("/dashboard/oral-reading-test/comprehension")}
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#5555EE] md:text-base shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)]"
        >
          <span>Continue to Comprehension</span>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  );
}