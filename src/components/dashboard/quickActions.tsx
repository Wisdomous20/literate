
import { UserRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRecentAssessments } from "@/lib/hooks/useRecentAssessments";
import { RecentAssessmentItem } from "@/service/assessment/getRecentAssessmentsService";
import "./quickActionsPop.css";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading",
  COMPREHENSION: "Comprehension",
  READING_FLUENCY: "Reading Fluency",
};

const classificationBadge: Record<string, { bg: string; text: string }> = {
  FRUSTRATION: { bg: "bg-[rgba(253,182,210,0.45)]", text: "text-[#C41048]" },
  INSTRUCTIONAL: { bg: "bg-[rgba(160,200,255,0.45)]", text: "text-[#1A5FB4]" },
  INDEPENDENT: { bg: "bg-[rgba(140,220,160,0.45)]", text: "text-[#1E7A35]" },
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
  minimal?: boolean;
}

export function QuickActions({ schoolYear, minimal }: QuickActionsProps) {
  const router = useRouter();
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
    }
  };

  // Card border style: equal sides + thick left purple accent
  const cardBorder = "border border-[#A855F7] border-l-[3px] rounded-xl";

  // Minimal mode: just the list, no card, no header
  if (minimal) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#6666FF]" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-[#00306E]/50">
            No students below grade level
          </div>
        ) : (
          assessments.map((item: RecentAssessmentItem, idx) => {
            const badge = classificationBadge[item.classificationLevel] ?? {
              bg: "bg-gray-50",
              text: "text-gray-500",
            };
            const pastelBg =
              item.classificationLevel === "FRUSTRATION"
                ? "bg-[rgba(253,182,210,0.35)]"
                : item.classificationLevel === "INSTRUCTIONAL"
                ? "bg-[rgba(160,200,255,0.35)]"
                : item.classificationLevel === "INDEPENDENT"
                ? "bg-[rgba(140,220,160,0.35)]"
                : "bg-[#FAF5FF]";
            const iconColor =
              item.classificationLevel === "FRUSTRATION"
                ? "text-[#C41048]"
                : item.classificationLevel === "INSTRUCTIONAL"
                ? "text-[#1A5FB4]"
                : item.classificationLevel === "INDEPENDENT"
                ? "text-[#1E7A35]"
                : "text-[#A855F7]";
            return (
              <button
                key={item.id}
                onClick={() => handleAssessmentClick(item)}
                type="button"
                className={`flex items-center justify-between px-4 py-3 transition-all hover:shadow-md hover:border-[#6666FF] hover:brightness-95 active:scale-95 motion-safe:animate-none ${cardBorder} ${pastelBg} pop-on-click`}
              >
                <div className="flex min-w-0 flex-col gap-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <UserRound className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                    <p className="truncate text-sm font-bold text-black">
                      {item.studentName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pl-5">
                    <span className="text-[11px] text-[#111111]">
                      {assessmentTypeLabels[item.assessmentType] ?? item.assessmentType}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                    >
                      {item.classificationLevel}
                    </span>
                  </div>
                </div>
                <span className="ml-2 shrink-0 text-[11px] text-[#1b1a1a]">
                  {formatDate(item.dateTaken)}
                </span>
              </button>
            );
          })
        )}
      </div>
    );
  }

  // Default: full card with header
  return (
    <div className="flex h-full flex-col rounded-3xl bg-linear-to-b from-white to-[#F8FAFF] p-5 shadow-[0px_0px_20px_1px_rgba(84,164,255,0.35)]">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[#00306E]">
          Recent Assessments
        </h3>
        <p className="text-xs text-[#5d5db6]">Students Below Grade Level</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#A855F7] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#6666FF]" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-[#00306E]/50">
            No students below grade level
          </div>
        ) : (
          assessments.map((item: RecentAssessmentItem, idx) => {
            const badge = classificationBadge[item.classificationLevel] ?? {
              bg: "bg-gray-100",
              text: "text-gray-500",
            };
            const pastelBg =
              item.classificationLevel === "FRUSTRATION"
                ? "bg-[rgba(253,182,210,0.35)]"
                : item.classificationLevel === "INSTRUCTIONAL"
                ? "bg-[rgba(160,200,255,0.35)]"
                : item.classificationLevel === "INDEPENDENT"
                ? "bg-[rgba(140,220,160,0.35)]"
                : "bg-[#FAF5FF]";
            const iconColor =
              item.classificationLevel === "FRUSTRATION"
                ? "text-[#C41048]"
                : item.classificationLevel === "INSTRUCTIONAL"
                ? "text-[#1A5FB4]"
                : item.classificationLevel === "INDEPENDENT"
                ? "text-[#1E7A35]"
                : "text-[#A855F7]";
            return (
              <button
                key={item.id}
                onClick={() => handleAssessmentClick(item)}
                type="button"
                className={`flex items-center justify-between px-4 py-3 transition-all hover:shadow-md hover:border-[#6666FF] hover:brightness-95 active:scale-95 motion-safe:animate-none ${cardBorder} ${pastelBg} pop-on-click`}

              >
                <div className="flex min-w-0 flex-col gap-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <UserRound className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                    <p className="truncate text-sm font-bold text-black">
                      {item.studentName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pl-5">
                    <span className="text-[11px] text-[#555555]">
                      {assessmentTypeLabels[item.assessmentType] ?? item.assessmentType}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                    >
                      {item.classificationLevel}
                    </span>
                  </div>
                </div>
                <span className="ml-2 shrink-0 text-[11px] text-[#555555]">
                  {formatDate(item.dateTaken)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}