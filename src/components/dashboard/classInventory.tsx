"use client";

import { useState } from "react";
import { ChevronDown, ClipboardList, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClassCard } from "./classCard";
import { CreateClassModal } from "./createClassModal";
import { createClass } from "@/app/actions/class/createClass";
import { useQueryClient } from "@tanstack/react-query";
import { useClassList } from "@/lib/hooks/useClassList";

type ClassCardVariant = "blue" | "yellow" | "cyan";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getSchoolYears(): string[] {
  const current = getCurrentSchoolYear();
  const [startYear] = current.split("-").map(Number);
  return [
    current,
    `${startYear - 1}-${startYear}`,
    `${startYear - 2}-${startYear - 1}`,
  ];
}

function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

interface ClassInventoryProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function ClassInventory({ selectedYear, onYearChange }: ClassInventoryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const schoolYears = getSchoolYears();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: rawClasses, isLoading, error: fetchError } = useClassList(selectedYear);
  const error = fetchError?.message ?? null;

  const classes = (rawClasses ?? []).map(
    (c: { id: string; name: string; studentCount: number }, index: number) => ({
      id: c.id,
      name: c.name,
      studentCount: c.studentCount,
      variant: getVariant(index),
    })
  );

  const previewClasses = classes.slice(0, 5);

  const handleCreateClass = async (data: { className: string; schoolYear: string }) => {
    const result = await createClass(data.className);
    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] });
    }
    return result;
  };

  const handleClassUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold text-[#00306E]">Class Inventory</h2>
          <button
            type="button"
            onClick={() => router.push("/dashboard/class/all")}
            className="rounded-full border border-[#6666FF] bg-transparent px-3 py-1 text-[11px] font-medium text-[#6666ff] ml-1 h-7 min-w-0 hover:bg-[#6666FF]/10 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-5 py-2 text-sm font-medium text-[#6666FF] flex items-center gap-1 h-10 min-w-30"
            >
              {selectedYear}
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {schoolYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      onYearChange(year);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      selectedYear === year
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg border border-[#7A7AFB] bg-[#6666FF] px-5 py-2 text-sm font-medium text-white shadow-[0px_1px_20px_rgba(65,155,180,0.47)] transition-opacity hover:opacity-90 h-10 min-w-30"
          >
            + Create Class
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-1 text-[15px] text-[#5d5db6] font-semibold mb-5">
        <ClipboardList className="w-5 h-5" />
        Manage your classes for the selected school year.
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
        </div>
      )}
      {!isLoading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {!isLoading && !error && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#00306E]/70 mb-2">No classes found for {selectedYear}</p>
          <p className="text-sm text-[#00306E]/50">Click Create Class to add your first class</p>
        </div>
      )}
      {!isLoading && !error && previewClasses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {previewClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classId={classItem.id}
              name={classItem.name}
              studentCount={classItem.studentCount}
              variant={classItem.variant}
              onClick={() => router.push(`/dashboard/class/${classItem.id}`)}
              onClassUpdated={handleClassUpdated}
            />
          ))}
        </div>
      )}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
      />
    </div>
  );
}