"use client";

import { ChevronLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassData {
  id: string;
  name: string;
  schoolYear: string;
}

interface ClassInfoBoxProps {
  classData: ClassData;
  totalStudents: number;
  onCreateStudent: () => void;
  isCompact?: boolean;
}

export function ClassInfoBox({
  classData,
  onCreateStudent,
  isCompact = false,
}: ClassInfoBoxProps) {
  const router = useRouter();

  if (isCompact) {
    return (
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            title="Go back"
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white transition-all hover:bg-[#5555DD] hover:shadow-[0_4px_12px_rgba(102,102,255,0.3)] active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col gap-0">
            <h1 className="text-base font-bold text-[#00306E] leading-tight">
              {classData.name}
            </h1>
            <span className="text-xs font-semibold text-[#6666FF]">
              SY {classData.schoolYear}
            </span>
          </div>
        </div>

        <button
          onClick={onCreateStudent}
          className="flex items-center gap-2 rounded-xl border border-[#7A7AFB] bg-linear-to-r from-[#6666FF] via-[#7270FF] to-[#7A7AFB] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(102,102,255,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(102,102,255,0.4)] active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Create Student
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            title="Go back"
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white transition-all hover:bg-[#5555DD] hover:shadow-[0_4px_12px_rgba(102,102,255,0.3)] active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-[#00306E] leading-tight">
              {classData.name}
            </h1>
            <span className="text-xs font-semibold text-[#6666FF]">
              SY {classData.schoolYear}
            </span>
          </div>
        </div>

        <button
          onClick={onCreateStudent}
          className="flex items-center gap-2 rounded-xl border border-[#7A7AFB] bg-[#5D5DFB] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(102,102,255,0.3)] transition-all hover:shadow-[0_8px_24px_rgba(102,102,255,0.4)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Student
        </button>
      </div>
    </div>
  );
}
