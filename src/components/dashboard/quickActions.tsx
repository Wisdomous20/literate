// src/components/dashboard/quickActions.tsx
"use client";

import { FileText, Loader2 } from "lucide-react";
import { useRecentAssessments } from "@/lib/hooks/useRecentAssessments";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading",
  COMPREHENSION: "Comprehension",
  READING_FLUENCY: "Reading Fluency",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuickActions() {
  const { data: assessments = [], isLoading } = useRecentAssessments();

  return (
    <div className="flex h-full flex-col rounded-4xl bg-white p-6 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      <div className="mb-4">
        <h3 className="text-[18px] font-semibold text-[#00306E]">
          Recent Assessments
        </h3>
        <p className="text-sm text-[#00306E]/70">
          Students Below Grade Level
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#6666FF]" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#00306E]/50">
            No students below grade level
          </div>
        ) : (
assessments.slice(0, 4).map((item) => (
              <div
              key={item.id}
              className="flex items-center justify-between rounded-[15px] border border-[rgba(0,48,110,0.21)] bg-[rgba(228,244,255,0.3)] px-5 py-4 shadow-md"
            >
              <div className="flex items-start gap-4">
                <FileText className="mt-1 h-6 w-6 text-[#6666FF]" />
                <div>
                  <h4 className="text-base font-semibold text-[#6666FF]">
                    {item.studentName}
                  </h4>
                  <p className="text-sm text-[#00306E]/60">
                    {assessmentTypeLabels[item.assessmentType] ||
                      item.assessmentType}{" "}
                    &middot; {item.classificationLevel}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm text-[#00306E]/70">
                {formatDate(item.dateTaken)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}