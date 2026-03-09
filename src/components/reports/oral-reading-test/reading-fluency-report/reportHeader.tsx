"use client";

import { ChevronLeft } from "lucide-react";
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
            <button
              type="button"
              className="rounded-lg border border-[#DE3B40] bg-[#DE3B40] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#DE3B40]/90"
            >
              Delete
            </button>
          </div>
        }
      />
      <div className="px-6 pt-4 lg:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-base font-semibold text-[#31318A] transition-opacity hover:opacity-70"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
      </div>
    </div>
  );
}