"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards";
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
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

export default function ReadingComprehensionReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  const assessment = useMemo(
    () =>
      allAssessments.find((a) => a.id === assessmentId) as
        | AssessmentData
        | undefined,
    [allAssessments, assessmentId],
  );

  if (isLoading) return <div>Loading...</div>;
  if (!assessment) return <div>No data found.</div>;

  const studentName = assessment.student?.name || "";
  const gradeLevel = assessment.student?.level
    ? `Grade ${assessment.student.level}`
    : "";
  const passage = assessment.passage;
  const comprehension = assessment.comprehension;
  const numberOfWords = passage?.content
    ? passage.content.split(/\s+/).filter(Boolean).length
    : 0;

  const answers: ComprehensionAnswer[] = comprehension?.answers || [];
  const literalCorrect = answers.filter(
    (a) => a.question?.tags === "Literal" && a.isCorrect,
  ).length;
  const inferentialCorrect = answers.filter(
    (a) => a.question?.tags === "Inferential" && a.isCorrect,
  ).length;
  const criticalCorrect = answers.filter(
    (a) => a.question?.tags === "Critical" && a.isCorrect,
  ).length;
  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const totalItems = comprehension?.totalItems ?? answers.length;
  const mistakes = totalItems - totalCorrect;
  const percentageGrade =
    totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

  const assessmentTypeLabel =
    assessmentTypeLabels[assessment.type] || assessment.type;

  // Dummy handlers for Export and Delete
  const handleExport = () => {
    alert("Export to PDF clicked!");
  };
  const handleDelete = () => {
    alert("Delete clicked!");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="w-full">
        <DashboardHeader
          title="Reading Comprehension Test Report"
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Export to PDF
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Delete
              </button>
            </div>
          }
        />
        <div className="mb-4 max-w-6xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-lg mt-6 px-6 py-3 text-base font-semibold text-[#00306E] hover:underline transition"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
        </div>
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-6xl mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full bg-[#f0f4ff]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <StudentInfoCard studentName={studentName} gradeLevel={gradeLevel} />
          </div>
          <div className="min-w-0">
            <ComprehensionMetricCards
              percentageGrade={percentageGrade}
              comprehensionLevel={comprehension?.classificationLevel ?? ""}
            />
          </div>
        </div>
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
              classificationLevel={comprehension?.classificationLevel ?? ""}
            />
          </div>
        </div>
      </main>
    </div>
  );
}