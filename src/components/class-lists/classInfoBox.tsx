"use client";

import { ArrowLeft } from "lucide-react";
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
  totalStudents,
  isCompact = false,
}: ClassInfoBoxProps) {
  const router = useRouter();

  if (isCompact) {
    return (
      <div
        data-tour-target="class-header"
        className="flex items-center justify-between flex-1"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
            <button
              onClick={() => router.back()}
              title="Go back"
              aria-label="Go back"
              className="relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow transition-transform bg-white text-[#6666FF] border border-[#6666FF]/40 hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              Back
            </button>
          </div>
          <div className="w-px h-5 bg-[#6666FF]/20" />
          <div className="flex flex-col gap-0">
            <h1 className="text-base font-bold text-[#00306E] leading-tight">
              {classData.name}
            </h1>
            <span className="text-xs font-semibold text-[#6666FF]">
              SY {classData.schoolYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#00306E]/60 uppercase tracking-tighter">Total Students:</span>
          <span className="text-xl font-bold text-[#6666FF]">{totalStudents}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
            <button
              onClick={() => router.back()}
              title="Go back"
              aria-label="Go back"
              className="relative flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 px-4 py-2 text-xs font-semibold shadow-sm transition-transform bg-white text-[#6666FF] hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              Back
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-[#00306E] leading-tight">
              {classData.name}
            </h1>
            <span className="text-xs font-semibold text-[#6666FF]">
              SY {classData.schoolYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#00306E]/60 uppercase tracking-tighter">Total Students:</span>
          <span className="text-xl font-bold text-[#6666FF]">{totalStudents}</span>
        </div>
      </div>
    </div>
  );
}
