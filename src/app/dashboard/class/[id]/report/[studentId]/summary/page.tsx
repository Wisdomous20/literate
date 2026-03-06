"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AssessmentSummary } from "@/components/assessment/assessmentSummary";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import {
  computeFinalClassification,
  type AssessmentCard,
  type AssessmentData,
  type ComprehensionAnswer,
} from "@/types/assessment";

export default function AssessmentSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  const found = useMemo(
    () =>
      allAssessments.find(
        (a) => a.id === assessmentId && a.type === "ORAL_READING",
      ) as AssessmentData | undefined,
    [allAssessments, assessmentId],
  );

  const { assessmentCards, oralReadingLevel } = useMemo(() => {
    if (!found) return { assessmentCards: [], oralReadingLevel: "" };

    const cards: AssessmentCard[] = [];

    // Fluency card
    if (found.oralFluency) {
      cards.push({
        id: "reading-fluency-report",
        title: "Oral Reading Fluency Test",
        percentage: found.oralFluency.oralFluencyScore ?? 0,
        level: found.oralFluency.classificationLevel || "",
      });
    }

    // Comprehension card
    if (found.comprehension) {
      const answers = found.comprehension.answers || [];
      const totalCorrect = answers.filter(
        (a: ComprehensionAnswer) => a.isCorrect,
      ).length;
      const totalItems = found.comprehension.totalItems ?? answers.length;
      const pct =
        totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
      cards.push({
        id: "comprehension-report",
        title: "Reading Comprehension Test",
        percentage: pct,
        level: found.comprehension.classificationLevel || "",
      });
    }

    // Final overall classification
    // Prefer the stored oralReadingResult; fallback to computing from sub-levels
    let level = "";
    if (found.oralReadingResult) {
      level = found.oralReadingResult.classificationLevel || "";
    } else {
      level = computeFinalClassification(
        found.oralFluency?.classificationLevel,
        found.comprehension?.classificationLevel,
      );
    }

    return { assessmentCards: cards, oralReadingLevel: level };
  }, [found]);

  const handleViewReport = (cardId: string) => {
    if (!assessmentId) return;
    if (cardId === "reading-fluency-report") {
      router.push(
        `/dashboard/class/${classId}/report/${studentId}/reading-fluency-report?id=${assessmentId}`,
      );
    } else if (cardId === "comprehension-report") {
      router.push(
        `/dashboard/class/${classId}/report/${studentId}/comprehension-report?id=${assessmentId}`,
      );
    }
  };

  const handleExportPdf = () => {
    alert("Export to PDF coming soon!");
  };

  if (isLoading) return <div>Loading...</div>;
  if (!found) return <div>No data found.</div>;

  return (
    <AssessmentSummary
      assessmentCards={assessmentCards}
      oralReadingLevel={{
        level: oralReadingLevel,
        label: "Overall Level Report",
      }}
      onViewReport={handleViewReport}
      onExportPdf={handleExportPdf}
      onBack={() => router.back()}
    />
  );
}