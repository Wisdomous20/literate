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
    <div className="flex flex-col justify-between rounded-[10px] p-4 min-h-25 bg-[#EFFDFF] border border-[#54A4FF] shadow-[0px_1px_10px_rgba(108,164,239,0.2)]">
      <div className="flex items-start gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF]`}
        >
          <FileText
            className={`h-4 w-4 ${tailwindIconColor}`}
            aria-hidden="true"
          />
        </div>
        <span className="text-sm font-semibold leading-5 text-[#003366]">
          {title}
        </span>
      </div>
      <span className={`text-[32px] font-bold leading-10 ${tailwindColor}`}>
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
