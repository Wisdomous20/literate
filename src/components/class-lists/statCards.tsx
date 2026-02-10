"use client";

import { FileText } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  tailwindColor: string; // text color for the value
  tailwindIconColor: string; // text color for the icon
}

function StatCard({
  title,
  value,
  tailwindColor,
  tailwindIconColor,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-[20px] p-5 min-h-[140px] bg-[#EFFDFF] border border-[#54A4FF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]`}
        >
          <FileText
            className={`h-5 w-5 ${tailwindIconColor}`}
            aria-hidden="true"
          />
        </div>
        <span className="text-base font-bold leading-[27px] text-[#003366]">
          {title}
        </span>
      </div>
      <span className={`text-[43px] font-bold leading-[64px] ${tailwindColor}`}>
        {value}
      </span>
    </div>
  );
}

interface StatCardsProps {
  assessedCount: number;
  independentCount: number;
  instructionalCount: number;
  frustratedCount: number;
}

export function StatCards({
  assessedCount,
  independentCount,
  instructionalCount,
  frustratedCount,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="No. of Assessed Students"
        value={assessedCount}
        tailwindColor="text-[#00306E]"
        tailwindIconColor="text-[#00306E]"
      />
      <StatCard
        title="Independent Students"
        value={independentCount}
        tailwindColor="text-[#1C9B5D]"
        tailwindIconColor="text-[#162DB0]"
      />
      <StatCard
        title="Instructional Students"
        value={instructionalCount}
        tailwindColor="text-[#1C9B5D]"
        tailwindIconColor="text-[#162DB0]"
      />
      <StatCard
        title="Frustrated Students"
        value={frustratedCount}
        tailwindColor="text-[#DE3B40]"
        tailwindIconColor="text-[#1A6673]"
      />
    </div>
  );
}
