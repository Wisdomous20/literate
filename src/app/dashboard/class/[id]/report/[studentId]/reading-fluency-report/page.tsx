"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReportHeader from "@/components/reports/oral-reading-test/reading-fluency-report/reportHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type {
  AssessmentData,
  OralFluencyMiscue,
  OralFluencyBehaviorData,
} from "@/types/assessment";

function formatTestType(testType?: string): string {
  if (testType === "POST_TEST") return "Post-Test";
  return "Pre-Test";
}

function buildBehaviorItems(
  behaviors: OralFluencyBehaviorData[],
): BehaviorItem[] {
  const detectedTypes = new Set(behaviors.map((b) => b.behaviorType));
  return [
    {
      label: "Does word-by-word reading",
      description: "(Nagbabasa nang pa-isa isang salita)",
      checked: detectedTypes.has("WORD_BY_WORD_READING"),
    },
    {
      label: "Lacks expression: reads in a monotonous tone",
      description: "(Walang damdamin; walang pagbabago ang tono)",
      checked: detectedTypes.has("MONOTONOUS_READING"),
    },
    {
      label: "Disregards Punctuation",
      description: "(Hindi pinapansin ang mga bantas)",
      checked: detectedTypes.has("DISMISSAL_OF_PUNCTUATION"),
    },
    {
      label: "Employs little or no method of analysis",
      description: "(Bahagya o walang paraan ng pagsusuri)",
      checked: false,
    },
  ];
}

export default function ReadingFluencyReportPage() {
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

  const miscues: OralFluencyMiscue[] = assessment.oralFluency?.miscues || [];
  const miscueData = {
    mispronunciation: miscues.filter(
      (m) => m.miscueType === "MISPRONUNCIATION",
    ).length,
    omission: miscues.filter((m) => m.miscueType === "OMISSION").length,
    substitution: miscues.filter((m) => m.miscueType === "SUBSTITUTION").length,
    transposition: miscues.filter((m) => m.miscueType === "TRANSPOSITION")
      .length,
    reversal: miscues.filter((m) => m.miscueType === "REVERSAL").length,
    insertion: miscues.filter((m) => m.miscueType === "INSERTION").length,
    repetition: miscues.filter((m) => m.miscueType === "REPETITION").length,
    selfCorrection: miscues.filter((m) => m.miscueType === "SELF_CORRECTION")
      .length,
    totalMiscue: assessment.oralFluency?.totalMiscues ?? miscues.length,
    oralFluencyScore: `${assessment.oralFluency?.oralFluencyScore ?? 0}%`,
    classificationLevel: assessment.oralFluency?.classificationLevel ?? "",
  };

  const studentName = assessment.student?.name || "";
  const gradeLevel = assessment.student?.level
    ? `Grade ${assessment.student.level}`
    : "";
  const passage = assessment.passage;
  const numberOfWords = passage?.content
    ? passage.content.split(/\s+/).filter(Boolean).length
    : (assessment.oralFluency?.totalWords ?? 0);

  const behaviorItems = buildBehaviorItems(
    assessment.oralFluency?.behaviors || [],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <ReportHeader />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <StudentInfoCard studentName={studentName} gradeLevel={gradeLevel} />
        <MetricCards
          wcpm={assessment.oralFluency?.wordsPerMinute ?? 0}
          readingTimeSeconds={assessment.oralFluency?.duration ?? 0}
          classificationLevel={
            assessment.oralFluency?.classificationLevel ?? ""
          }
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <PassageInfoCard
            passageTitle={passage?.title ?? ""}
            passageLevel={passage?.level ? `Grade ${passage.level}` : ""}
            numberOfWords={numberOfWords}
            testType={formatTestType(passage?.testType)}
            assessmentType="Oral Reading Test"
          />
          <AudioPlaybackCard audioSrc={assessment.oralFluency?.audioUrl} />
        </div>
        <div className="flex flex-col">
          <BehaviorChecklist behaviors={behaviorItems} />
        </div>
        <div className="flex flex-col">
          <MiscueAnalysisReport miscueData={miscueData} />
        </div>
      </div>
    </div>
  );
}