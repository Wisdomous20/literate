"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ClassCard } from "./classCard";
import { CreateClassModal } from "./createClassModal";
import { createClass } from "@/app/actions/class/createClass";
import { useClassList } from "@/lib/hooks/useClassList";
import { cn } from "@/lib/utils";

type ClassCardVariant = "blue" | "yellow" | "cyan";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function getNextSchoolYear(): string {
  const [startYear] = getCurrentSchoolYear().split("-").map(Number);
  return `${startYear + 1}-${startYear + 2}`;
}

interface ClassInventoryProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

function getVariant(index: number): ClassCardVariant {
  const variants: ClassCardVariant[] = ["blue", "yellow", "cyan"];
  return variants[index % variants.length];
}

export function ClassInventory({
  selectedYear,
  onYearChange,
  showToast,
}: ClassInventoryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const {
    data: rawClasses,
    isLoading,
    error: fetchError,
  } = useClassList(selectedYear);

  const error = fetchError?.message ?? null;

  const currentYear = getCurrentSchoolYear();
  const nextYear = getNextSchoolYear();
  const now = new Date();
  const nextYearStart = new Date(Number(nextYear.split("-")[0]), 7, 1);
  const isNextYearDisabled = now < nextYearStart;

  const yearsWithData = useMemo(() => {
    const years = [currentYear];
    if (!years.includes(nextYear)) years.push(nextYear);
    return years.sort((a, b) => b.localeCompare(a));
  }, [currentYear, nextYear]);

  const classes = (rawClasses ?? []).map(
    (
      c: { id: string; name: string; studentCount: number },
      index: number,
    ): {
      id: string;
      name: string;
      studentCount: number;
      variant: ClassCardVariant;
    } => ({
      id: c.id,
      name: c.name,
      studentCount: c.studentCount,
      variant: getVariant(index),
    }),
  );

  // Fixed 4 items per page (2 columns x 2 rows)
  const itemsPerPage = 4;
  const totalPages = Math.ceil(classes.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleClasses = classes.slice(startIndex, startIndex + itemsPerPage);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const refreshClasses = () => {
    queryClient.invalidateQueries({ queryKey: ["classes", selectedYear] });
  };

  const handleCreateClass = async (data: {
    className: string;
    schoolYear: string;
  }) => {
    const result = await createClass(data.className);
    if (result.success) {
      refreshClasses();
      showToast?.("Class created successfully!", "success");
    } else {
      showToast?.("Failed to create class.", "error");
    }
    return result;
  };

  const handleClassUpdated = async () => {
    refreshClasses();
  };

  return (
    <div className="w-full font-poppins">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#00306E]">
                Class Inventory
              </h2>
              <button
                type="button"
                onClick={() => router.push("/dashboard/class/all")}
                className="rounded-full bg-[#5D5DFB] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#4a4ae8] shadow-sm"
              >
                View All
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5D5DFB]/70 font-medium">
              <ClipboardList className="w-3 h-3" />
              <span>Create and manage your class inventory</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 z-30">
            {/* Year Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-[#5D5DFB]/30 bg-[#5D5DFB]/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-[#5D5DFB] whitespace-nowrap hover:bg-[#5D5DFB]/10 transition-colors"
              >
                School Year
                <ChevronDown className="h-3 w-3" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-[#5D5DFB]/30 bg-white py-1 shadow-lg">
                  {yearsWithData.map((year) => {
                    const isCurrent = year === currentYear;
                    const isNext = year === nextYear;
                    const disabled = isNext && isNextYearDisabled;
                    return (
                      <button
                        key={year}
                        onClick={() => {
                          if (!disabled) {
                            onYearChange(year);
                            setIsDropdownOpen(false);
                          }
                        }}
                        disabled={disabled}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm transition-colors",
                          year === selectedYear
                            ? "font-semibold text-[#5D5DFB] bg-[#E4F4FF]"
                            : "text-[#00306E] hover:bg-[#E4F4FF]",
                          disabled && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {year}
                        {isCurrent && " (Current)"}
                        {isNext && isNextYearDisabled && " (Upcoming)"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Class Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-[#5D5DFB] px-4 py-1.5 text-xs sm:text-sm font-medium text-white shadow-[0px_1px_20px_rgba(93,93,251,0.4)] transition-colors hover:bg-[#4a4ae8] whitespace-nowrap"
            >
              + Create Class
            </button>
          </div>
        </div>
      </div>

      {/* Class Cards Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#5D5DFB]" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl bg-white">
          <p className="text-[#00306E]/70 mb-2">
            No classes found for {selectedYear}
          </p>
          <p className="text-sm text-[#00306E]/50">
            Click Create Class to add your first class
          </p>
        </div>
      ) : (
        <div className="relative w-full min-h-[320px] flex flex-col">
          {/* Class cards grid - 2 columns x 2 rows */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
            {visibleClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="border-l border-t border-r-4 border-b-4 border-[#5D5DFB] rounded-2xl overflow-hidden bg-white min-h-35 shadow-lg shadow-[#5D5DFB]/10"
              >
                <ClassCard
                  classRoomId={classItem.id}
                  name={classItem.name}
                  studentCount={classItem.studentCount}
                  variant={classItem.variant}
                  onClick={() =>
                    router.push(`/dashboard/class/${classItem.id}`)
                  }
                  onClassUpdated={handleClassUpdated}
                />
              </div>
            ))}
          </div>

          {/* Carousel Navigation Arrows */}
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5DFB] text-white shadow-2xl ring-2 ring-white transition-all hover:scale-110 hover:bg-[#4a4deb]",
                  currentPage === 0 && "cursor-not-allowed",
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#5D5DFB] text-white shadow-2xl ring-2 ring-white transition-all hover:scale-110 hover:bg-[#4a4deb]",
                  currentPage === totalPages - 1 && "cursor-not-allowed",
                )}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Pagination always below the boxes */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentPage(index)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all",
                currentPage === index
                  ? "bg-[#0C1A6D] text-white"
                  : "border-2 border-[#5D5DFB] text-[#5D5DFB] hover:bg-[#5D5DFB]/10",
              )}
              aria-label={`Go to page ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
        schoolYear={selectedYear}
      />
    </div>
  );
}
