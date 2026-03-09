"use client";

import { FileText } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  tailwindColor: string;
  tailwindIconColor: string;
}

function StatCard({
  title,
  value,
  tailwindColor,
  tailwindIconColor,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#54A4FF] bg-[#EFFDFF] p-3 shadow-[0px_1px_8px_rgba(108,164,239,0.18)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#DAE6FF] bg-[rgba(74,74,252,0.06)]">
          <FileText className={`h-3.5 w-3.5 ${tailwindIconColor}`} />
        </div>
        <span className="text-xs font-semibold text-[#003366] leading-tight">
          {title}
        </span>
      </div>
      <span className={`mt-2 text-2xl font-bold ${tailwindColor}`}>{value}</span>
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
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatCard
        title="Assessed Students"
        value={assessedCount}
        tailwindColor="text-[#00306E]"
        tailwindIconColor="text-[#00306E]"
      />
      <StatCard
        title="Independent"
        value={independentCount}
        tailwindColor="text-[#1C9B5D]"
        tailwindIconColor="text-[#162DB0]"
      />
      <StatCard
        title="Instructional"
        value={instructionalCount}
        tailwindColor="text-[#1C9B5D]"
        tailwindIconColor="text-[#162DB0]"
      />
      <StatCard
        title="Frustrated"
        value={frustratedCount}
        tailwindColor="text-[#DE3B40]"
        tailwindIconColor="text-[#1A6673]"
      />
    </div>
  );
}