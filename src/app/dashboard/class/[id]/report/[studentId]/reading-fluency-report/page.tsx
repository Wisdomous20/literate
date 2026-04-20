"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import ViewMiscuesModal from "@/components/reports/oral-reading-test/reading-fluency-report/viewMiscuesModal";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { useEditMiscues } from "@/components/oral-reading-test/useEditMiscues";
import { fetchOralFluencyMiscues } from "@/app/actions/oral-fluency/getMiscues";
import { updateMiscueAction } from "@/app/actions/oral-fluency/updateMiscue";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import { useClassById } from "@/lib/hooks/useClassById";
import { exportFluencyReportPdf } from "@/lib/exportFluencyReportPdf";
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type {
  AssessmentData,
  OralFluencyMiscue,
  OralFluencyBehaviorData,
} from "@/types/assessment";
import type { MiscueResult } from "@/types/oral-reading";

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

function countMiscuesByType(miscues: MiscueResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
  }
  return counts;
}

function buildMiscueData(miscues: MiscueResult[], totalMiscues: number, oralFluencyScore: number, classificationLevel: string) {
  const counts = countMiscuesByType(miscues);
  return {
    mispronunciation: counts["MISPRONUNCIATION"] || 0,
    omission: counts["OMISSION"] || 0,
    substitution: counts["SUBSTITUTION"] || 0,
    transposition: counts["TRANSPOSITION"] || 0,
    reversal: counts["REVERSAL"] || 0,
    insertion: counts["INSERTION"] || 0,
    repetition: counts["REPETITION"] || 0,
    selfCorrection: counts["SELF_CORRECTION"] || 0,
    totalMiscue: totalMiscues,
    oralFluencyScore: `${Math.round(oralFluencyScore)}%`,
    classificationLevel,
  };
}

export default function ReadingFluencyReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const [showMiscuesModal, setShowMiscuesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Local overrides after editing miscues
  const [localMiscues, setLocalMiscues] = useState<MiscueResult[] | null>(null);
  const [localTotalMiscues, setLocalTotalMiscues] = useState<number | null>(null);
  const [localOralFluencyScore, setLocalOralFluencyScore] = useState<number | null>(null);
  const [localClassificationLevel, setLocalClassificationLevel] = useState<string | null>(null);

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

  // Convert OralFluencyMiscue to MiscueResult
  const originalMiscues: MiscueResult[] = useMemo(() => {
    const miscues: OralFluencyMiscue[] = assessment?.oralFluency?.miscues ?? [];
    return miscues.map((m) => ({
      miscueType: m.miscueType,
      expectedWord: m.expectedWord,
      spokenWord: m.spokenWord ?? null,
      wordIndex: m.wordIndex,
      timestamp: null,
      isSelfCorrected: m.isSelfCorrected,
    }));
  }, [assessment]);

  const activeMiscues = localMiscues ?? originalMiscues;

  const totalWords = assessment?.oralFluency?.totalWords ?? 0;
  const sessionId = assessment?.oralFluency?.id;

  const editMiscues = useEditMiscues({
    originalMiscues: activeMiscues,
    totalWords,
    sessionId,
    onSave: (editedMiscues, metrics) => {
      setLocalMiscues(editedMiscues);
      setLocalTotalMiscues(metrics.totalMiscues);
      setLocalOralFluencyScore(metrics.oralFluencyScore);
      setLocalClassificationLevel(metrics.classificationLevel);
    },
  });

  const handleApproveMiscue = useCallback(
    async (miscue: MiscueResult) => {
      if (!sessionId) return;
      const dbResult = await fetchOralFluencyMiscues(sessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = dbResult.data.find(
        (m) =>
          m.wordIndex === miscue.wordIndex &&
          m.miscueType === miscue.miscueType &&
          m.expectedWord === miscue.expectedWord,
      );
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "approve",
      });
      if (!result.success || !result.updatedMetrics) return;
      const updated = activeMiscues.filter(
        (m) =>
          !(
            m.wordIndex === miscue.wordIndex &&
            m.miscueType === miscue.miscueType &&
            m.expectedWord === miscue.expectedWord
          ),
      );
      setLocalMiscues(updated);
      setLocalTotalMiscues(result.updatedMetrics.totalMiscues);
      setLocalOralFluencyScore(result.updatedMetrics.oralFluencyScore);
      setLocalClassificationLevel(result.updatedMetrics.classificationLevel);
    },
    [sessionId, activeMiscues],
  );

  const handleUpdateMiscueType = useCallback(
    async (miscue: MiscueResult, newType: MiscueResult["miscueType"]) => {
      if (!sessionId) return;
      const dbResult = await fetchOralFluencyMiscues(sessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = dbResult.data.find(
        (m) =>
          m.wordIndex === miscue.wordIndex &&
          m.miscueType === miscue.miscueType &&
          m.expectedWord === miscue.expectedWord,
      );
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "update",
        newMiscueType: newType,
      });
      if (!result.success || !result.updatedMetrics) return;
      const updated = activeMiscues.map((m) =>
        m.wordIndex === miscue.wordIndex &&
        m.miscueType === miscue.miscueType &&
        m.expectedWord === miscue.expectedWord
          ? { ...m, miscueType: newType }
          : m,
      );
      setLocalMiscues(updated);
      setLocalTotalMiscues(result.updatedMetrics.totalMiscues);
      setLocalOralFluencyScore(result.updatedMetrics.oralFluencyScore);
      setLocalClassificationLevel(result.updatedMetrics.classificationLevel);
    },
    [sessionId, activeMiscues],
  );

  if (isLoading) return <div>Loading...</div>;
  if (!assessment) return <div>No data found.</div>;

  const currentTotalMiscues = localTotalMiscues ?? (assessment.oralFluency?.totalMiscues ?? 0);
  const currentOralFluencyScore = localOralFluencyScore ?? (assessment.oralFluency?.oralFluencyScore ?? 0);
  const currentClassificationLevel = localClassificationLevel ?? (assessment.oralFluency?.classificationLevel ?? "");
  const duration = assessment.oralFluency?.duration ?? 0;
  const wordsCorrect = Math.max(0, totalWords - currentTotalMiscues);
  const wcpm = duration > 0 ? Math.round((wordsCorrect / duration) * 60) : 0;

  const miscueData = buildMiscueData(activeMiscues, currentTotalMiscues, currentOralFluencyScore, currentClassificationLevel);

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

  const handleExport = () => {
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    exportFluencyReportPdf(
      {
        studentName,
        gradeLevel,
        className: classData?.name ?? "—",
        passageTitle: passage?.title ?? "—",
        passageLevel: passage?.level ? `Grade ${passage.level}` : "—",
        numberOfWords,
        testType: formatTestType(passage?.testType),
        assessmentType: assessmentTypeLabel,
        wcpm,
        readingTimeSeconds: Math.round(duration),
        classificationLevel: currentClassificationLevel,
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


  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="w-full">
        <DashboardHeader title="Oral Fluency Test Report" />
        <div className="mb-4 max-w-6xl mx-auto">
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 rounded-full bg-[#6666FF] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#5555EE] active:scale-95"
              type="button"
            >
              <svg
                className="h-5 w-5"
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
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-300 mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard
            studentName={studentName}
            gradeLevel={gradeLevel}
            className={classData?.name}
          />
          <MetricCards
            wcpm={wcpm}
            readingTimeSeconds={Math.round(duration)}
            classificationLevel={currentClassificationLevel}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <PassageInfoCard
              passageTitle={passage?.title ?? "—"}
              passageLevel={passage?.level ? `Grade ${passage.level}` : "—"}
              numberOfWords={numberOfWords}
              testType={formatTestType(passage?.testType)}
              assessmentType={assessmentTypeLabel}
            />
            <AudioPlaybackCard audioSrc={assessment.oralFluency?.audioUrl} />
          </div>

          <BehaviorChecklist behaviors={behaviorItems} />

          <MiscueAnalysisReport
            miscueData={miscueData}
            onViewMiscues={() => setShowMiscuesModal(true)}
            onEditMiscues={() => setShowEditModal(true)}
          />
        </div>
      </main>

      <ViewMiscuesModal
        open={showMiscuesModal}
        onClose={() => setShowMiscuesModal(false)}
        passageContent={passage?.content ?? ""}
        miscues={activeMiscues}
        alignedWords={undefined}
        passageLevel={passage?.level ? `Grade ${passage.level}` : undefined}
      />

      {/* Edit Miscues Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-[#003366]">
              Edit Miscues
            </h2>
            <div className="flex-1 overflow-auto">
              <PassageDisplay
                content={passage?.content ?? ""}
                miscues={
                  editMiscues.isEditing
                    ? editMiscues.editedMiscues
                    : activeMiscues
                }
                alignedWords={undefined}
                passageLevel={
                  passage?.level ? String(passage.level) : undefined
                }
                expanded
                resizable={false}
                editMode={editMiscues}
                onApproveMiscue={sessionId ? handleApproveMiscue : undefined}
                onUpdateMiscueType={
                  sessionId ? handleUpdateMiscueType : undefined
                }
              />
            </div>
            {!editMiscues.isEditing && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    editMiscues.enterEditMode();
                  }}
                  className="rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5555EE]"
                >
                  Start Editing
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}