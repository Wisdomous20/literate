"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClassCard } from "./classCard";
import { CreateClassModal } from "./createClassModal";
import { createClass } from "@/app/actions/class/createClass";
import { getClassListBySchoolYear } from "@/app/actions/class/getClassList";

type ClassCardVariant = "blue" | "yellow" | "cyan";

interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
  variant: ClassCardVariant;
}

// Helper to get current school year
function getCurrentSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

// Generate school years for dropdown (current and past 2 years)
function getSchoolYears(): string[] {
  const current = getCurrentSchoolYear();
  const [startYear] = current.split("-").map(Number);

  return [
    current,
    `${startYear - 1}-${startYear}`,
    `${startYear - 2}-${startYear - 1}`,
  ];
}

// Assign variant based on index for visual variety
function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

export function ClassInventory() {
  const router = useRouter();
  const schoolYears = getSchoolYears();
  const [selectedYear, setSelectedYear] = useState(schoolYears[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes when selected year changes
  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getClassListBySchoolYear(selectedYear);

      if (result.success && result.classes) {
        const mappedClasses: ClassItem[] = result.classes.map((c, index) => ({
          id: c.id,
          name: c.name,
          studentCount: c.studentCount,
          variant: getVariant(index),
        }));
        setClasses(mappedClasses);
      } else {
        setError(result.error || "Failed to fetch classes");
        setClasses([]);
      }
    } catch {
      setError("An unexpected error occurred");
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);

    if (result.success) {
      // Refresh the class list after creating a new class
      await fetchClasses();
    }

    return result;
  };

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/class/${classId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[20px] font-semibold leading-[30px] text-[#00306E]">
          Class Inventory
        </h2>
        <div className="flex gap-3">
          {/* School Year Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/30 bg-white px-4 py-2 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              {selectedYear}
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                {schoolYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
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

          {/* Create Class Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="
    flex h-[40px] w-[150px] items-center justify-center gap-2
    rounded-lg border border-[#7A7AFB]
    bg-[#2E2E68]
    px-5 py-2.5
    text-sm font-medium text-white
    shadow-[0px_1px_20px_rgba(65,155,180,0.47)]
    transition-opacity hover:opacity-90
  "
          >
            Create Class
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#00306E]/70 mb-2">
            No classes found for {selectedYear}
          </p>
          <p className="text-sm text-[#00306E]/50">
            Click &quot;Create Class&quot; to add your first class
          </p>
        </div>
      )}

      {/* Class Grid - 5 columns on large screens, 4 on medium, 3 on small */}
      {!isLoading && !error && classes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classId={classItem.id}
              name={classItem.name}
              studentCount={classItem.studentCount}
              variant={classItem.variant}
              onClick={() => handleClassClick(classItem.id)}
              onClassUpdated={() => fetchClasses()}
            />
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
      />
    </div>
  );
}
