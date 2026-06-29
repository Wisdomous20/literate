"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AssessmentReport } from "@/components/assessment/assessmentReport";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import type { AssessmentData } from "@/types/assessment";

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
  const selectedAssessmentType =
    assessmentTypeParam && assessmentTypeParam !== "ALL"
      ? assessmentTypeParam
      : null;
  const assessmentTypeLabel = selectedAssessmentType
    ? (assessmentTypeLabels[selectedAssessmentType] ?? selectedAssessmentType)
    : "All Assessments";

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-[#6666FF]" />
      </div>
    );
  }

  const firstAssessment = allAssessments[0] as AssessmentData | undefined;
  const studentName = firstAssessment?.student?.name ?? "";
  const studentGrade = firstAssessment?.student?.level
    ? `Grade ${firstAssessment.student.level}`
    : "";

  const seen = new Set<string>();
  const filteredAssessments = allAssessments
    .filter((assessment) => {
      if (selectedAssessmentType && assessment.type !== selectedAssessmentType) {
        return false;
      }
      if (seen.has(assessment.id)) return false;
      seen.add(assessment.id);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime(),
    );

  const assessments = filteredAssessments.map((assessment, idx) => ({
    attempt: filteredAssessments.length - idx,
    assessmentType: assessmentTypeLabels[assessment.type] ?? assessment.type,
    testType: formatTestType(assessment.passage?.testType),
    assessmentDate: assessment.dateTaken
      ? new Date(assessment.dateTaken).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "",
    schoolYear: "",
    id: assessment.id,
    type: assessment.type,
    language: assessment.passage?.language ?? "-",
  }));

  const handleRowClick = (assessment: { id: string; type: string }) => {
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
    <AssessmentReport
      studentName={studentName}
      studentGrade={studentGrade}
      assessmentTypeLabel={assessmentTypeLabel}
      assessments={assessments}
      loading={isLoading}
      onRowClick={handleRowClick}
      onBack={() => router.back()}
    />
  );
}
