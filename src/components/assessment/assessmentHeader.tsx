"use client";

import { LayoutDashboard } from "lucide-react";

interface AssessmentHeaderProps {
  title: string;
}

export function AssessmentHeader({ title }: AssessmentHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-13 items-center border-b-[3px] border-[#5D5DFB] bg-white px-4 md:h-15 md:px-6 lg:h-17.5 lg:px-8">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-4 w-4 text-[#6666FF]" />
        <h1 className="text-base font-semibold text-[#31318A] md:text-lg">{title}</h1>
      </div>
    </header>
  );
}