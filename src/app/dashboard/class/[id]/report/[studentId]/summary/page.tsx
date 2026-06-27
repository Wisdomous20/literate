"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AssessmentSummary } from "@/components/assessment/assessmentSummary";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import { useClassById } from "@/lib/hooks/useClassById";
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
  const classRoomId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  const { data: classData } = useClassById(classRoomId);

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

    // Fluency card — always show for ORAL_READING
    if (found.oralFluencyResult) {
      cards.push({
        id: "reading-fluency-report",
        title: "Oral Reading Fluency Test",
        percentage: found.oralFluencyResult.oralFluencyScore ?? 0,
        level: found.oralFluencyResult.classificationLevel || "—",
      });
    } else {
      cards.push({
        id: "reading-fluency-report",
        title: "Oral Reading Fluency Test",
        percentage: 0,
        level: "Not Taken",
      });
    }

    // Comprehension card — always show for ORAL_READING
    if (found.comprehensionResult) {
      const answers = found.comprehensionResult.answers || [];
      const totalCorrect = answers.filter(
        (a: ComprehensionAnswer) => a.isCorrect,
      ).length;
      const totalItems = found.comprehensionResult.totalItems ?? answers.length;
      const pct =
        totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
      cards.push({
        id: "comprehension-report",
        title: "Reading Comprehension Test",
        percentage: pct,
        level: found.comprehensionResult.classificationLevel || "—",
      });
    } else {
      cards.push({
        id: "comprehension-report",
        title: "Reading Comprehension Test",
        percentage: 0,
        level: "Not Taken",
      });
    }

    let level = "";
    if (found.oralReadingResult) {
      level = found.oralReadingResult.classificationLevel || "";
    } else {
      level = computeFinalClassification(
        found.oralFluencyResult?.classificationLevel,
        found.comprehensionResult?.classificationLevel,
      );
    }

    return { assessmentCards: cards, oralReadingLevel: level };
  }, [found]);

  const handleViewReport = (cardId: string) => {
    if (!assessmentId) return;
    if (cardId === "reading-fluency-report" && !found?.oralFluencyResult) return;
    if (cardId === "comprehension-report" && !found?.comprehensionResult) return;

    if (cardId === "reading-fluency-report") {
      router.push(
        `/dashboard/class/${classRoomId}/report/${studentId}/reading-fluency-report?id=${assessmentId}`,
      );
    } else if (cardId === "comprehension-report") {
      router.push(
        `/dashboard/class/${classRoomId}/report/${studentId}/comprehension-report?id=${assessmentId}`,
      );
    }
  };

  const handleExportPdf = () => {};

  if (isLoading) return <div>Loading...</div>;
  if (!found) return <div>No data found.</div>;

  return (
    <AssessmentSummary
      studentName={found.student.name}
      studentGrade={found.student.level != null ? `Grade ${found.student.level}` : ""}
      studentClass={classData?.name}
      assessmentTypeLabel="Oral Reading Test"
      assessmentId={assessmentId}
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