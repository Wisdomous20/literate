"use client";

import { LayoutGrid } from "lucide-react";

interface ClassListsHeaderProps {
  onCreateStudent: () => void;
}

export function ClassListsHeader({ onCreateStudent }: ClassListsHeaderProps) {
  return (
    <header className="flex h-[118px] items-center justify-between px-10 border-b border-[#8D8DEC] shadow-[0px_4px_4px_#54A4FF] rounded-tl-[50px]">
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-6 w-6 text-[#6666FF]" />
        <h1 className="text-[25px] font-semibold text-[#00306E]">
          Class Lists
        </h1>
      </div>

      <button
        onClick={onCreateStudent}
        type="button"
        className="px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 bg-[#2E2E68] border border-[#7A7AFB] shadow-[0px_1px_20px_rgba(65,155,180,0.47)] rounded-[8px]"
      >
        Create Student
      </button>
    </header>
  );
}
