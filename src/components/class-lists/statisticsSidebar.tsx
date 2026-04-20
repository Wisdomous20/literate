"use client";

import type { AssessmentTypeFilter } from "./assessmentFilterTabs";

interface StatsSidebarProps {
  stats: {
    assessed: number;
    independent: number;
    instructional: number;
    frustrated: number;
  };
  assessmentType: AssessmentTypeFilter;
}

const statConfigs = [
  {
    label: "No. of Assessed Students",
    key: "assessed",
    bg: "bg-[#C2C2FF]/[.35]",
    text: "text-[#6666FF]",
  },
  {
    label: "Instructional Students",
    key: "instructional",
    bg: "bg-[#7F51C6]/[.44]",
    text: "text-[#7F51C6]",
  },
  {
    label: "Independent Students",
    key: "independent",
    bg: "bg-[#6666FF]/[.38]",
    text: "text-[#6666FF]",
  },
  {
    label: "Frustrated Students",
    key: "frustrated",
    bg: "bg-[#993D8D]/[.37]",
    text: "text-[#993D8D]",
  },
];

const typeLabels: Record<AssessmentTypeFilter, string> = {
  ALL: "All Assessments",
  ORAL_READING: "Oral Reading Test",
  READING_FLUENCY: "Reading Fluency Test",
  COMPREHENSION: "Reading Comprehension Test",
};

export function StatisticsSidebar({
  stats,
  assessmentType,
}: StatsSidebarProps) {
  const totalCount = stats.assessed;
  const displayLabel = typeLabels[assessmentType];
  const percent = Math.min(totalCount / 100, 1);
  const radius = 64; // bigger radius for a bigger circle
  const circumference = 2 * Math.PI * radius;
  const arc = percent * circumference;

return (
  <div className="bg-white rounded-2xl border border-[#9999FF]/25 p-6 shadow-[0_4px_16px_rgba(102,102,255,0.08)] flex flex-col gap-6 w-full">
    {/* Statistics Title */}
    <div>
      <h3 className="text-xs font-bold text-[#00306E]/60 uppercase tracking-wider mb-1">
        Statistics
      </h3>
      <h2 className="text-sm font-bold text-[#6666FF]">{displayLabel}</h2>
    </div>

    {/* Circle Count Display */}
    <div className="flex items-center justify-center">
      <div className="relative h-36 w-36 flex items-center justify-center z-10">
        <svg className="absolute h-36 w-36 z-10" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#C2C2FF"
            strokeWidth="16"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#6666FF"
            strokeWidth="4"
            strokeDasharray={`${arc} ${circumference}`}
            strokeDashoffset={circumference - arc}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-5xl font-bold text-[#6666FF]">
            {totalCount}
          </span>
          <span className="text-xs font-semibold text-[#00306E]/60">
            Assessed
          </span>
        </div>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-3 w-full">
      {statConfigs.map((stat) => (
        <div
          key={stat.key}
          className={`rounded-2xl ${stat.bg} p-4 flex flex-col justify-between h-28 w-full`}
        >
          <span className="text-xs font-semibold text-black mb-2">{stat.label}</span>
          <span className={`text-3xl font-bold ${stat.text} mt-auto`}>
            {stats[stat.key as keyof typeof stats]}
          </span>
        </div>
      ))}
    </div>
  </div>
);
}