// src/components/reading-fluency-test/report/reportHeader.tsx
"use client";

import { LayoutDashboard } from "lucide-react";

export default function ReportHeader() {
  return (
    <div className="flex items-center gap-3 border-b-[3px] border-[#5D5DFB] bg-white px-8 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
        <LayoutDashboard size={20} className="text-[#5D5DFB]" />
      </div>
      <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
        Oral Fluency Test Report
      </h1>
    </div>
  );
}