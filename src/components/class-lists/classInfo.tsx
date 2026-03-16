"use client";

import { Folder } from "lucide-react";

interface ClassInfoProps {
  className: string;
  schoolYear: string;
}

export function ClassInfo({ className, schoolYear }: ClassInfoProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#C9C9FF] to-[#E0DCFF] shadow-[0_4px_16px_rgba(102,102,255,0.15)]">
        <Folder className="h-6 w-6 text-[#6666FF]" fill="#6666FF" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-[#00306E] leading-tight">
          {className}
        </h2>
        <span className="text-xs font-semibold text-[#6666FF]">
          SY {schoolYear}
        </span>
      </div>
    </div>
  );
}