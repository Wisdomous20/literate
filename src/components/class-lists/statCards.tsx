"use client";

import {
  FileText,
  Trophy,
  BookOpen,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  tailwindColor: string;
  tailwindIconColor: string;
  icon: React.ReactNode;
}

function StatCard({
  title,
  value,
  tailwindColor,
  tailwindIconColor,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#9999FF]/25 bg-gradient-to-br from-white/80 to-[#F8F9FF]/60 p-3 shadow-[0_4px_16px_rgba(102,102,255,0.1)] transition-all hover:shadow-[0_8px_24px_rgba(102,102,255,0.15)] hover:border-[#9999FF]/35 backdrop-blur-sm h-24">
      <div className="flex items-start justify-between gap-3 h-full">
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tailwindIconColor} border border-[#6666FF]/15 shadow-[0_2px_8px_rgba(102,102,255,0.12)]`}>
            {icon}
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-[#00306E]/70 uppercase tracking-tighter">
              {title}
            </span>
            <div className={`mt-1 text-2xl font-bold ${tailwindColor}`}>
              {value}
            </div>
          </div>
        </div>
      </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Assessed Students"
        value={assessedCount}
        tailwindColor="text-[#00306E]"
        tailwindIconColor="from-[#C9D9FF] to-[#E4F4FF]"
        icon={
          <TrendingUp className="h-5 w-5 text-[#6666FF]" />
        }
      />
      <StatCard
        title="Independent"
        value={independentCount}
        tailwindColor="text-[#1C9B5D]"
        tailwindIconColor="from-[#C8E6C9] to-[#E8F5E9]"
        icon={
          <Trophy className="h-5 w-5 text-[#1C9B5D]" />
        }
      />
      <StatCard
        title="Instructional"
        value={instructionalCount}
        tailwindColor="text-[#FFA500]"
        tailwindIconColor="from-[#FFE5CC] to-[#FFF3E0]"
        icon={
          <BookOpen className="h-5 w-5 text-[#FFA500]" />
        }
      />
      <StatCard
        title="Frustrated"
        value={frustratedCount}
        tailwindColor="text-[#DE3B40]"
        tailwindIconColor="from-[#FFCDD2] to-[#FFEBEE]"
        icon={
          <AlertCircle className="h-5 w-5 text-[#DE3B40]" />
        }
      />
    </div>
  );
}