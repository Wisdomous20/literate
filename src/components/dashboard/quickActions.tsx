"use client";

import { FileText, Loader2 } from "lucide-react";
import { useRecentAssessments } from "@/lib/hooks/useRecentAssessments";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading",
  COMPREHENSION: "Comprehension",
  READING_FLUENCY: "Reading Fluency",
};

const classificationBadge: Record<string, { bg: string; text: string }> = {
  FRUSTRATION: { bg: "bg-red-50", text: "text-red-600" },
  INSTRUCTIONAL: { bg: "bg-blue-50", text: "text-blue-600" },
  INDEPENDENT: { bg: "bg-green-50", text: "text-green-700" },
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface QuickActionsProps {
  schoolYear: string;
}

export function QuickActions({ schoolYear }: QuickActionsProps) {
  const { data: assessments = [], isLoading } = useRecentAssessments(schoolYear);

  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[#00306E]">
          Recent Assessments
        </h3>
        <p className="text-xs text-[#5d5db6]">Students Below Grade Level</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#6666FF]" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-[#00306E]/50">
            No students below grade level
          </div>
        ) : (
          assessments.slice(0, 5).map((item) => {
            const badge = classificationBadge[item.classificationLevel] ?? {
              bg: "bg-gray-50",
              text: "text-gray-500",
            };
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[rgba(0,48,110,0.10)] bg-[rgba(228,244,255,0.4)] px-4 py-2.5 transition-colors hover:bg-[#E4F4FF]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FF]">
                    <FileText className="h-4 w-4 text-[#6666FF]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#6666FF]">
                      {item.studentName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#00306E]/60">
                        {assessmentTypeLabels[item.assessmentType] ??
                          item.assessmentType}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                      >
                        {item.classificationLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="ml-2 shrink-0 text-[11px] text-[#00306E]/50">
                  {formatDate(item.dateTaken)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}