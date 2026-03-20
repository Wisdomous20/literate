"use client";

import { X, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRecentAssessments } from "@/lib/hooks/useRecentAssessments";
import { RecentAssessmentItem } from "@/service/assessment/getRecentAssessmentsService";

function getCurrentSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading",
  COMPREHENSION: "Comprehension",
  READING_FLUENCY: "Reading Fluency",
};

const classificationColors: Record<string, { bg: string; text: string; border: string }> = {
  FRUSTRATION: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  INSTRUCTIONAL: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  INDEPENDENT: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface RecentAssessmentsSidePanelProps {
  onClose: () => void;
}

export function RecentAssessmentsSidePanel({ onClose }: RecentAssessmentsSidePanelProps) {
  const router = useRouter();
  const schoolYear = getCurrentSchoolYear();
  const { data: assessments = [], isLoading } = useRecentAssessments(schoolYear);

  const handleAssessmentClick = (item: RecentAssessmentItem) => {
    const reportTypeMap: Record<string, string> = {
      ORAL_READING: "summary",
      READING_FLUENCY: "reading-fluency-report",
      COMPREHENSION: "comprehension-report",
    };
    const reportType = reportTypeMap[item.assessmentType];
    if (reportType && item.classRoomId && item.studentId && item.id) {
      router.push(
        `/dashboard/class/${item.classRoomId}/report/${item.studentId}/${reportType}?id=${item.id}`
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="w-96 max-w-full flex flex-col bg-white shadow-[0_-20px_60px_rgba(0,48,110,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#6666FF]/15 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#00306E]">
              Recent Assessments
            </h2>
            <p className="text-xs text-[#00306E]/60 mt-1">
              School Year {schoolYear}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#00306E]/60 transition-colors hover:bg-[#F0F0FF] hover:text-[#00306E]"
            title="Close"
            type="button"
            aria-label="Close Recent Assessments panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#6666FF]" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-8 w-8 text-[#6666FF]/30 mb-3" />
              <p className="text-sm text-[#00306E]/60">No recent assessments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((item: RecentAssessmentItem) => {
                const colorScheme = classificationColors[item.classificationLevel] || {
                  bg: "bg-gray-50",
                  text: "text-gray-700",
                  border: "border-gray-200",
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => handleAssessmentClick(item)}
                    type="button"
                    className={`w-full rounded-xl border ${colorScheme.border} ${colorScheme.bg} px-4 py-3 text-left transition-all hover:shadow-md active:scale-95`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60">
                        <FileText className="h-4 w-4 text-[#6666FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[#00306E]">
                          {item.studentName}
                        </p>
                        <p className="text-xs text-[#00306E]/60 mt-0.5">
                          {assessmentTypeLabels[item.assessmentType] ?? item.assessmentType}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorScheme.text}`}
                          >
                            {item.classificationLevel}
                          </span>
                          <span className="text-[10px] text-[#00306E]/50">
                            {formatDate(item.dateTaken)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}