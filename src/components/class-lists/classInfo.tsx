"use client";

import { Folder } from "lucide-react";

interface ClassInfoProps {
  className: string;
  schoolYear: string;
}

export function ClassInfo({ className, schoolYear }: ClassInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <Folder className="h-6 w-6 text-[#0066EC]" fill="#0066EC" />
      <div>
        <h2 className="text-lg font-semibold text-[#00306E]">{className}</h2>
        <span className="text-[15px] font-bold text-[#162DB0]">
          SY {schoolYear}
        </span>
      </div>
    </div>
  );
}
