"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type AssessmentTypeFilter =
  | "ALL"
  | "ORAL_READING"
  | "COMPREHENSION"
  | "READING_FLUENCY";

interface AssessmentTypeFilterProps {
  onFilterChange?: (filter: AssessmentTypeFilter) => void;
}

const assessmentTypeOptions = [
  { value: "ALL" as const, label: "All Students" },
  { value: "ORAL_READING" as const, label: "Oral Reading" },
  { value: "COMPREHENSION" as const, label: "Comprehension" },
  { value: "READING_FLUENCY" as const, label: "Reading Fluency" },
];

export function AssessmentTypeFilterDropdown({
  onFilterChange,
}: AssessmentTypeFilterProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<AssessmentTypeFilter>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel =
    assessmentTypeOptions.find((o) => o.value === selectedFilter)?.label ??
    "All Students";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-[#6666FF]/25 bg-[#6666FF]/8 px-4 py-2 text-xs font-medium text-[#6666FF] transition-all hover:bg-[#EEEEFF] min-w-40"
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border border-[#6666FF]/20 bg-white py-1 shadow-lg">
          {assessmentTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSelectedFilter(opt.value);
                setIsOpen(false);
                onFilterChange?.(opt.value);
              }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[#E4F4FF] ${
                selectedFilter === opt.value
                  ? "font-semibold text-[#6666FF] bg-[#EEEEFF]"
                  : "text-[#00306E]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}