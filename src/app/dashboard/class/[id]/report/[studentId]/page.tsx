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

  const classRoomId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentTypeParam = searchParams.get("assessmentType");
  const assessmentTypeLabel = assessmentTypeParam
    ? (assessmentTypeLabels[assessmentTypeParam] ?? assessmentTypeParam)
    : "Unknown Assessment Type";

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
  const assessments = assessmentTypeParam
    ? allAssessments
        .filter((a) => {
          if (a.type !== assessmentTypeParam) return false;
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        })
        .sort(
          (a, b) =>
            new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime(),
        )
        .map((a, idx) => ({
          attempt: idx + 1,
          assessmentType: assessmentTypeLabels[a.type] ?? a.type,
          testType: formatTestType(a.passage?.testType),
          assessmentDate: a.dateTaken
            ? new Date(a.dateTaken).toLocaleDateString()
            : "",
          schoolYear: "",
          id: a.id,
          type: a.type,
        }))
    : [];

  const handleRowClick = (assessment: { id: string; type: string }) => {
    if (assessment.type === "ORAL_READING") {
      router.push(
        `/dashboard/class/${classRoomId}/report/${studentId}/summary?id=${assessment.id}`,
      );
    } else if (assessment.type === "READING_FLUENCY") {
      router.push(
        `/dashboard/class/${classRoomId}/report/${studentId}/reading-fluency-report?id=${assessment.id}`,
      );
    } else if (assessment.type === "COMPREHENSION") {
      router.push(
        `/dashboard/class/${classRoomId}/report/${studentId}/comprehension-report?id=${assessment.id}`,
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