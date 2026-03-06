"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AssessmentReport } from "@/components/assessment/assessmentReport";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import type { AssessmentData, AssessmentTableRow } from "@/types/assessment";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

function formatTestType(testType?: string): string {
  if (testType === "POST_TEST") return "Post-Test";
  return "Pre-Test";
}

export default function AssessmentReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentTypeParam = searchParams.get("assessmentType");
  const assessmentTypeLabel = assessmentTypeParam
    ? assessmentTypeLabels[assessmentTypeParam] || assessmentTypeParam
    : "Unknown Assessment Type";

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 7;

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  // Derive student info from the first assessment's student relation
  const firstAssessment = allAssessments[0] as AssessmentData | undefined;
  const studentName = firstAssessment?.student?.name || "";
  const studentGrade = firstAssessment?.student?.level
    ? `Grade ${firstAssessment.student.level}`
    : "";

  // Filter and map assessments
  const assessments: AssessmentTableRow[] = assessmentTypeParam
    ? allAssessments
        .filter((a) => a.type === assessmentTypeParam)
        .sort(
          (a, b) =>
            new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime(),
        )
        .map((a, idx) => ({
          attempt: idx + 1,
          assessmentType: assessmentTypeLabels[a.type] || a.type,
          testType: formatTestType(a.passage?.testType),
          assessmentDate: a.dateTaken
            ? new Date(a.dateTaken).toLocaleDateString()
            : "",
          schoolYear: "",
          id: a.id,
          type: a.type,
        }))
    : [];

  const totalPages = Math.max(
    1,
    Math.ceil(assessments.length / recordsPerPage),
  );

  const handleRowClick = (assessment: AssessmentTableRow) => {
    if (assessment.type === "ORAL_READING") {
      router.push(
        `/dashboard/class/${classId}/report/${studentId}/summary?id=${assessment.id}`,
      );
    } else if (assessment.type === "READING_FLUENCY") {
      router.push(
        `/dashboard/class/${classId}/report/${studentId}/reading-fluency-report?id=${assessment.id}`,
      );
    } else if (assessment.type === "COMPREHENSION") {
      router.push(
        `/dashboard/class/${classId}/report/${studentId}/comprehension-report?id=${assessment.id}`,
      );
    }
  };

  return (
    <div>
      <AssessmentReport
        studentName={studentName}
        studentGrade={studentGrade}
        assessmentTypeLabel={assessmentTypeLabel}
        assessments={assessments}
        loading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRowClick={handleRowClick}
        onBack={() => router.back()}
      />
    </div>
  );
}