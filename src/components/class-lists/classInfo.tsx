"use client";

import { Folder } from "lucide-react";

interface ClassInfoProps {
  className: string;
  schoolYear: string;
}

export function ClassInfo({ className, schoolYear }: ClassInfoProps) {
  return (
    <div className="flex items-center gap-2">
      <Folder className="h-4 w-4 text-[#0066EC]" fill="#0066EC" />
      <div>
        <h2 className="text-sm font-semibold text-[#00306E]">{className}</h2>
        <span className="text-[11px] font-bold text-[#162DB0]">
          SY {schoolYear}
        </span>
      </div>
    </div>
  );
}