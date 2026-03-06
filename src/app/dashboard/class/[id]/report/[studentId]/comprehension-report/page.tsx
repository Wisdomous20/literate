// src/app/dashboard/class/[id]/report/[studentId]/comprehension-report/page.tsx
"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ComprehensionReportHeader from "@/components/reports/oral-reading-test/comprehension-report/reportHeader";
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

  // Derive assessment type label from actual data
  const assessmentTypeLabel =
    assessmentTypeLabels[assessment.type] || assessment.type;

  return (
    <div className="min-h-screen bg-[#f0f4ff] p-4 sm:p-6 lg:p-8">
      <ComprehensionReportHeader />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
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
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    </div>
  );
}