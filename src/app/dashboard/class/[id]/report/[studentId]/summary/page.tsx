"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AssessmentSummary } from "@/components/assessment/assessmentSummary";

export default function AssessmentSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const attempt = searchParams.get("attempt");
  const testType = searchParams.get("testType");
  const schoolYear = searchParams.get("schoolYear");

  // Mock data
  const assessmentCards = [
    {
      id: "reading-fluency-report",
      title: "Oral Reading Fluency Test",
      percentage: 80,
      level: "Independent",
    },
    {
      id: "comprehension-report",
      title: "Reading Comprehension Test",
      percentage: 80,
      level: "Independent",
    },
  ];

  const oralReadingLevel = {
    level: "Independent",
    label: "Overall Level Report",
  };

  const handleViewReport = (cardId: string) => {
    router.push(
      `/dashboard/class/${classId}/report/${studentId}/${cardId}?attempt=${attempt}&testType=${testType}&schoolYear=${schoolYear}`
    );
  };

  const handleExportPdf = () => {
    alert("Export to PDF coming soon!");
  };

  return (
    <AssessmentSummary
      assessmentCards={assessmentCards}
      oralReadingLevel={oralReadingLevel}
      onViewReport={handleViewReport}
      onExportPdf={handleExportPdf}
      onBack={() => router.back()}
    />
  );
}