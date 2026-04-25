"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FileText, ClipboardCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import { useClassById } from "@/lib/hooks/useClassById";
import { exportComprehensionReportPdf } from "@/lib/exportComprehensionReportPdf";
import type { AssessmentData, ComprehensionAnswer } from "@/types/assessment";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

function formatTestType(testType?: string): string {
  if (testType === "POST_TEST") return "Post-Test";
  return "Pre-Test";
}

function getLevelColorClass(level: string): string {
  if (!level) return "text-[#CE330C]";
  switch (level.toLowerCase()) {
    case "frustration":
      return "text-[#DC2626]";
    case "instructional":
      return "text-[#2563EB]";
    case "independent":
      return "text-[#16A34A]";
    default:
      return "text-[#CE330C]";
  }
}

export default function ReadingComprehensionReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classRoomId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  const { data: classData } = useClassById(classRoomId);

  const assessment = useMemo(
    () =>
      allAssessments.find((a) => a.id === assessmentId) as
        | AssessmentData
        | undefined,
    [allAssessments, assessmentId],
  );

  if (isLoading) return <div>Loading...</div>;
  if (!assessment) return <div>No data found.</div>;

  const studentName = assessment.student?.name ?? "";
  const gradeLevel = assessment.student?.level
    ? `Grade ${assessment.student.level}`
    : "";
  const passage = assessment.passage;
  const comprehension = assessment.comprehension;
  const numberOfWords = passage?.content
    ? passage.content.split(/\s+/).filter(Boolean).length
    : 0;

  const answers: ComprehensionAnswer[] = comprehension?.answers ?? [];

  const literalAnswers = answers.filter((a) => a.question?.tags === "Literal");
  const inferentialAnswers = answers.filter(
    (a) => a.question?.tags === "Inferential",
  );
  const criticalAnswers = answers.filter(
    (a) => a.question?.tags === "Critical",
  );

  const literalCorrect = literalAnswers.filter((a) => a.isCorrect).length;
  const inferentialCorrect = inferentialAnswers.filter(
    (a) => a.isCorrect,
  ).length;
  const criticalCorrect = criticalAnswers.filter((a) => a.isCorrect).length;
  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const totalItems = comprehension?.totalItems ?? answers.length;
  const mistakes = totalItems - totalCorrect;
  const percentageGrade =
    totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

  const comprehensionLevel = comprehension?.classificationLevel ?? "";

  const assessmentTypeLabel =
    assessmentTypeLabels[assessment.type] ?? assessment.type;

  const handleExport = () => {
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    exportComprehensionReportPdf(
      {
        studentName,
        gradeLevel,
        className: classData?.name ?? "\u2014",
        passageTitle: passage?.title ?? "\u2014",
        passageLevel: passage?.level ? `Grade ${passage.level}` : "\u2014",
        numberOfWords,
        testType: formatTestType(passage?.testType),
        assessmentType: assessmentTypeLabel,
        score: totalCorrect,
        totalItems,
        percentage: percentageGrade,
        classificationLevel: comprehensionLevel,
        literal: { correct: literalCorrect, total: literalAnswers.length },
        inferential: {
          correct: inferentialCorrect,
          total: inferentialAnswers.length,
        },
        critical: { correct: criticalCorrect, total: criticalAnswers.length },
      },
      `Comprehension_Report_${safeName}`,
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="w-full">
        <DashboardHeader title="Reading Comprehension Test Report" />
        <div className="mb-4 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 rounded-full bg-[#6666FF] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5555EE] active:scale-95"
              type="button"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>
            <button
              onClick={handleExport}
              className="rounded-full bg-[#297CEC] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              type="button"
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-6xl mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Row 1: Student Info | Percentage Grade | Comprehension Level — 3 equal boxes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-w-0">
            <StudentInfoCard
              studentName={studentName}
              gradeLevel={gradeLevel}
              className={classData?.name}
            />
          </div>

          {/* Percentage Grade Card */}
          <div className="flex flex-col justify-center gap-2 rounded-xl border-t border-l border-r-4 border-b-4 border-t-[#54A4FF] border-l-[#54A4FF] border-r-[#297CEC] border-b-[#297CEC] bg-[#EFFDFF] px-5 py-5 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#DAE6FF] bg-[rgba(74,74,252,0.06)]">
                <FileText size={16} className="text-[#1A6673]" />
              </div>
              <h3 className="text-sm font-bold leading-tight text-[#003366]">
                Percentage Grade
              </h3>
            </div>
            <p className="pl-10 text-4xl font-bold text-[#1A6673]">
              {percentageGrade}%
            </p>
            <span className="pl-10 text-xs font-medium text-[#003366]/60">
              Percentage
            </span>
          </div>

          {/* Comprehension Level Card */}
          <div className="flex flex-col justify-center gap-2 rounded-xl border-t border-l border-r-4 border-b-4 border-t-[#54A4FF] border-l-[#54A4FF] border-r-[#297CEC] border-b-[#297CEC] bg-[#EFFDFF] px-5 py-5 shadow-[0_1px_20px_rgba(108,164,239,0.37)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#DAE6FF] bg-[rgba(74,74,252,0.06)]">
                <ClipboardCheck size={16} className="text-[#CE330C]" />
              </div>
              <h3 className="text-sm font-bold leading-tight text-[#003366]">
                Comprehension Level
              </h3>
            </div>
            <p
              className={`pl-10 text-2xl font-bold ${getLevelColorClass(comprehensionLevel)}`}
            >
              {comprehensionLevel || "—"}
            </p>
            <span className="pl-10 text-xs font-medium text-[#003366]/60">
              Comprehension Level
            </span>
          </div>
        </div>

        {/* Row 2: Passage Info | Comprehension Breakdown */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <PassageInfoCard
              passageTitle={passage?.title ?? ""}
              passageLevel={passage?.level ? `Grade ${passage.level}` : ""}
              numberOfWords={numberOfWords}
              testType={formatTestType(passage?.testType)}
              assessmentType={assessmentTypeLabel}
            />
          </div>
          <div className="min-w-0">
            <ComprehensionBreakdownReport
              score={`${totalCorrect}`}
              literal={literalCorrect}
              inferential={inferentialCorrect}
              critical={criticalCorrect}
              mistakes={mistakes}
              numberOfItems={totalItems}
              classificationLevel={comprehensionLevel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
