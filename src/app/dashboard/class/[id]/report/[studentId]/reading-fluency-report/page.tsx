"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import { useClassById } from "@/lib/hooks/useClassById";
import { exportFluencyReportPdf } from "@/lib/exportFluencyReportPdf";
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type {
  AssessmentData,
  OralFluencyMiscue,
  OralFluencyBehaviorData,
} from "@/types/assessment";

const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

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
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const { data: allAssessments = [], isLoading } =
    useAssessmentsByStudent(studentId);

  const { data: classData } = useClassById(classId);

  const assessment = useMemo(
    () =>
      allAssessments.find((a) => a.id === assessmentId) as
        | AssessmentData
        | undefined,
    [allAssessments, assessmentId],
  );

  if (isLoading) return <div>Loading...</div>;
  if (!assessment) return <div>No data found.</div>;

  const miscues: OralFluencyMiscue[] = assessment.oralFluency?.miscues ?? [];
  const miscueData = {
    mispronunciation: miscues.filter((m) => m.miscueType === "MISPRONUNCIATION")
      .length,
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
    oralFluencyScore: `${Math.round(assessment.oralFluency?.oralFluencyScore ?? 0)}%`,
    classificationLevel: assessment.oralFluency?.classificationLevel ?? "",
  };

  const studentName = assessment.student?.name ?? "";
  const gradeLevel = assessment.student?.level
    ? `Grade ${assessment.student.level}`
    : "";
  const passage = assessment.passage;
  const numberOfWords = passage?.content
    ? passage.content.split(/\s+/).filter(Boolean).length
    : (assessment.oralFluency?.totalWords ?? 0);

  const behaviorItems = buildBehaviorItems(
    assessment.oralFluency?.behaviors ?? [],
  );

  const assessmentTypeLabel =
    assessmentTypeLabels[assessment.type] ?? assessment.type;

  const totalWords = assessment.oralFluency?.totalWords ?? numberOfWords;
  const totalMiscues = assessment.oralFluency?.totalMiscues ?? 0;
  const duration = assessment.oralFluency?.duration ?? 0;
  const wordsCorrect = Math.max(0, totalWords - totalMiscues);
  const wcpm = duration > 0 ? Math.round((wordsCorrect / duration) * 60) : 0;
  const classificationLevel = assessment.oralFluency?.classificationLevel ?? "";

  const handleExport = () => {
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    exportFluencyReportPdf(
      {
        studentName,
        gradeLevel,
        className: classData?.name ?? "\u2014",
        passageTitle: passage?.title ?? "\u2014",
        passageLevel: passage?.level ? `Grade ${passage.level}` : "\u2014",
        numberOfWords,
        testType: formatTestType(passage?.testType),
        assessmentType: assessmentTypeLabel,
        wcpm,
        readingTimeSeconds: Math.round(duration),
        classificationLevel,
        miscueData,
        behaviors: behaviorItems.map((b) => ({
          label: b.label,
          description: b.description,
          checked: !!b.checked,
        })),
      },
      `Oral_Fluency_Report_${safeName}`,
    );
  };

  const handleDelete = () => {
    alert("Delete clicked!");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="w-full">
        <DashboardHeader
          title="Oral Fluency Test Report"
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
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>
        </div>
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-6xl mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard studentName={studentName} gradeLevel={gradeLevel} />
          <MetricCards
            wcpm={wcpm}
            readingTimeSeconds={duration}
            classificationLevel={classificationLevel}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <PassageInfoCard
              passageTitle={passage?.title ?? ""}
              passageLevel={passage?.level ? `Grade ${passage.level}` : ""}
              numberOfWords={numberOfWords}
              testType={formatTestType(passage?.testType)}
              assessmentType={assessmentTypeLabel}
            />
            <AudioPlaybackCard audioSrc={assessment.oralFluency?.audioUrl} />
          </div>
          <BehaviorChecklist behaviors={behaviorItems} />
          <MiscueAnalysisReport miscueData={miscueData} />
        </div>
      </main>
    </div>
  );
}
