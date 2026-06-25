"use client";

import { LayoutDashboard } from "lucide-react";

interface ReadingComprehensionReportHeaderProps {
  title?: string;
}

export default function ReadingComprehensionReportHeader({ title = "Reading Comprehension Test Report" }: ReadingComprehensionReportHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b-[3px] border-[#5D5DFB] bg-white px-4 md:h-17.5 md:px-6">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
          <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 text-[#5D5DFB]" />
        </div>
        <h1 className="text-base md:text-lg font-semibold text-[#483efa]">
          {title}
        </h1>
      </div>
    </header>
  );
}