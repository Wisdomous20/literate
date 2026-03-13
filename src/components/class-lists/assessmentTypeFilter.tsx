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
  { value: "ORAL_READING" as const, label: "Oral Reading Test" },
  { value: "COMPREHENSION" as const, label: "Comprehension Test" },
  { value: "READING_FLUENCY" as const, label: "Reading Fluency Test" },
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
        className="flex items-center gap-2 rounded-xl border border-[#9999FF]/40 bg-white/90 px-4 py-2.5 text-xs font-bold text-[#6666FF] transition-all hover:bg-white hover:shadow-[0_6px_20px_rgba(102,102,255,0.15)] focus:outline-none focus:ring-1 focus:ring-[#6666FF]/20 shadow-[0_4px_16px_rgba(102,102,255,0.12)] backdrop-blur-sm min-w-56"
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-56 rounded-2xl border border-[#9999FF]/25 bg-white/95 py-2 shadow-[0_12px_40px_rgba(102,102,255,0.25)] backdrop-blur-sm">
          {assessmentTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSelectedFilter(opt.value);
                setIsOpen(false);
                onFilterChange?.(opt.value);
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                selectedFilter === opt.value
                  ? "text-[#6666FF] bg-gradient-to-r from-[#EEF0FF] to-[#F5F7FF]"
                  : "text-[#00306E] hover:bg-[#F8F9FF]"
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