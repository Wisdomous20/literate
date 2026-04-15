"use client";

export type AssessmentTypeFilter =
  | "ALL"
  | "ORAL_READING"
  | "COMPREHENSION"
  | "READING_FLUENCY";

const filterOptions = [
  { value: "ALL" as const, label: "All Students" },
  { value: "ORAL_READING" as const, label: "Oral Reading Test" },
  { value: "READING_FLUENCY" as const, label: "Reading Fluency Test" },
  { value: "COMPREHENSION" as const, label: "Reading Comprehension Test" },
];

interface AssessmentFilterTabsProps {
  selectedType: AssessmentTypeFilter;
  onFilterChange: (type: AssessmentTypeFilter) => void;
  isCompact?: boolean;
}

export function AssessmentFilterTabs({
  selectedType,
  onFilterChange,
  isCompact = false,
}: AssessmentFilterTabsProps) {
  if (isCompact) {
    return (
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className="relative flex flex-col items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <span
              className={`text-xs font-semibold transition-colors ${
                selectedType === option.value
                  ? "text-[#6666FF]"
                  : "text-[#00306E]/60 hover:text-[#00306E]"
              }`}
            >
              {option.label}
            </span>
            <div
              className={`h-0.5 w-full rounded-full transition-all ${
                selectedType === option.value
                  ? "bg-[#6666FF]"
                  : "bg-transparent"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#9999FF]/25 p-4 shadow-[0_4px_16px_rgba(102,102,255,0.08)]">
      <div className="flex items-center gap-6 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className="relative flex flex-col items-center gap-2 transition-all whitespace-nowrap"
          >
            <span
              className={`text-sm font-semibold transition-colors ${
                selectedType === option.value
                  ? "text-[#6666FF]"
                  : "text-[#00306E]/60 hover:text-[#00306E]"
              }`}
            >
              {option.label}
            </span>
            <div
              className={`h-1 w-full rounded-full transition-all ${
                selectedType === option.value
                  ? "bg-[#6666FF]"
                  : "bg-transparent"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}