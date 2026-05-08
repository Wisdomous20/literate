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

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <DashboardHeader title="Reading Comprehension Test Report" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#6666FF]/20 border-t-[#6666FF]" />
            <span className="text-sm font-medium text-[#00306E]/60">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }
  if (!assessment) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <DashboardHeader title="Reading Comprehension Test Report" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm font-medium text-[#00306E]/60">No data found.</p>
        </div>
      </div>
    );
  }

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

  const literalAnswers = answers.filter((a) => a.tag === "Literal");
  const inferentialAnswers = answers.filter((a) => a.tag === "Inferential");
  const criticalAnswers = answers.filter((a) => a.tag === "Critical");

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
      <DashboardHeader title="Reading Comprehension Test Report" />

      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:px-8">
        <div className="rounded-2xl bg-white overflow-hidden flex flex-col flex-1 border-t border-l border-r-[4px] border-b-[4px] border-[#A855F7] border-r-[#5D5DFB] border-b-[#5D5DFB]">
          {/* Header bar */}
          <div className="px-5 py-4 bg-white border-b border-[#EDE9FE]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
                  <button
                    onClick={() => window.history.back()}
                    className="relative flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 px-4 py-2 text-xs font-semibold shadow-sm transition-transform bg-white text-[#6666FF] hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                </div>
                <div className="h-6 w-px bg-[#C4B5FD] mx-1" />
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-base font-bold text-[#3B2F7F] leading-tight">{studentName}</h1>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#5D5DFB] uppercase tracking-widest">{gradeLevel}</span>
                    {classData?.name && (
                      <>
                        <span className="text-[#C4B5FD] font-bold">·</span>
                        <span className="text-[11px] font-semibold text-[#5D5DFB]">{classData.name}</span>
                      </>
                    )}
                    {assessmentId && (
                      <>
                        <span className="text-[#C4B5FD] font-bold">·</span>
                        <span className="font-mono text-[9px] text-[#5D5DFB]/70 break-all">{assessmentId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full translate-y-1 bg-[#B3A4F1]" />
                <button
                  onClick={handleExport}
                  className="relative inline-flex items-center gap-1.5 rounded-full bg-[#6666FF] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[#5555EE] hover:-translate-y-0.5 active:translate-y-0"
                  type="button"
                >
                  Export to PDF
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Row 1: Student Info | Percentage Grade | Comprehension Level */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="min-w-0">
                <StudentInfoCard
                  studentName={studentName}
                  gradeLevel={gradeLevel}
                  className={classData?.name}
                />
              </div>

              {/* Percentage Grade Card */}
              <div className="flex flex-col justify-center gap-2 rounded-xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-[#F8F5FF] px-5 py-5 shadow-[0_1px_20px_rgba(168,85,247,0.15)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E9D5FF] bg-[rgba(168,85,247,0.06)]">
                    <FileText size={16} className="text-[#A855F7]" />
                  </div>
                  <h3 className="text-sm font-bold leading-tight text-[#3B2F7F]">
                    Percentage Grade
                  </h3>
                </div>
                <p className="pl-10 text-4xl font-bold text-[#5D5DFB]">
                  {percentageGrade}%
                </p>
                <span className="pl-10 text-xs font-medium text-[#3B2F7F]/60">
                  Percentage
                </span>
              </div>

              {/* Comprehension Level Card */}
              <div className="flex flex-col justify-center gap-2 rounded-xl border-t border-l border-r-4 border-b-4 border-t-[#A855F7] border-l-[#A855F7] border-r-[#6653F9] border-b-[#6653F9] bg-[#F8F5FF] px-5 py-5 shadow-[0_1px_20px_rgba(168,85,247,0.15)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E9D5FF] bg-[rgba(168,85,247,0.06)]">
                    <ClipboardCheck size={16} className="text-[#A855F7]" />
                  </div>
                  <h3 className="text-sm font-bold leading-tight text-[#3B2F7F]">
                    Comprehension Level
                  </h3>
                </div>
                <p
                  className={`pl-10 text-2xl font-bold ${getLevelColorClass(comprehensionLevel)}`}
                >
                  {comprehensionLevel || "—"}
                </p>
                <span className="pl-10 text-xs font-medium text-[#3B2F7F]/60">
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
          </div>
        </div>
      </main>
    </div>
  );
}
