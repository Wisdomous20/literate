"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type AssessmentTypeFilter =
  | "ORAL_READING"
  | "COMPREHENSION"
  | "ORAL_READING_TEST";

interface AssessmentTypeFilterProps {
  onFilterChange?: (filter: AssessmentTypeFilter) => void;
}

const assessmentTypeOptions = [
  { value: "ORAL_READING" as const, label: "Oral Reading Test" },
  { value: "COMPREHENSION" as const, label: "Reading Comprehension Test" },
  { value: "ORAL_READING_TEST" as const, label: "Reading Fluency Test" },
];

export function AssessmentTypeFilterDropdown({
  onFilterChange,
}: AssessmentTypeFilterProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<AssessmentTypeFilter>("ORAL_READING");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleFilterChange = (value: AssessmentTypeFilter) => {
    setSelectedFilter(value);
    setIsDropdownOpen(false);
    onFilterChange?.(value);
  };

  const selectedLabel =
    assessmentTypeOptions.find((opt) => opt.value === selectedFilter)?.label ||
    "Oral Reading Test";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#d9efff] bg-[#E4F4FF] border border-[#54A4FF] min-w-[220px]"
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#162DB0] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-[#54A4FF] bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
          {assessmentTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFilterChange(option.value)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                selectedFilter === option.value
                  ? "bg-[#E4F4FF] font-medium text-[#162DB0]"
                  : "text-[#00306E]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
