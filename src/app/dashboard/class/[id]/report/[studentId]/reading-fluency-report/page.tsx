"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  Download,
  Loader2,
} from "lucide-react";
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
import { updateBehaviorsAction } from "@/app/actions/oral-fluency/updateBehaviors";
import { useAssessmentsByStudent } from "@/lib/hooks/useStudentAssessments";
import { useClassById } from "@/lib/hooks/useClassById";
import { useQueryClient } from "@tanstack/react-query";
import { exportFluencyReportPdf } from "@/lib/exportFluencyReportPdf";
import {
  findMatchingDbMiscue,
  removeFirstMatchingMiscue,
  updateFirstMatchingSpokenWord,
  updateFirstMatchingMiscueType,
} from "@/lib/miscueEditing";
import type {
  BehaviorItem,
  BehaviorType,
} from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
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
      key: "WORD_BY_WORD_READING",
      label: "Does word-by-word reading",
      description: "(Nagbabasa nang pa-isa isang salita)",
      checked: detectedTypes.has("WORD_BY_WORD_READING"),
    },
    {
      key: "MONOTONOUS_READING",
      label: "Lacks expression: reads in a monotonous tone",
      description: "(Walang damdamin; walang pagbabago ang tono)",
      checked: detectedTypes.has("MONOTONOUS_READING"),
    },
    {
      key: "DISMISSAL_OF_PUNCTUATION",
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

function buildMiscueData(
  miscues: MiscueResult[],
  totalMiscues: number,
  oralFluencyScore: number,
  classificationLevel: string,
) {
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const assessmentId = searchParams.get("id");

  const [showMiscuesModal, setShowMiscuesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Local overrides after editing miscues
  const [localMiscues, setLocalMiscues] = useState<MiscueResult[] | null>(
    null,
  );
  const [localTotalMiscues, setLocalTotalMiscues] = useState<number | null>(
    null,
  );
  const [localOralFluencyScore, setLocalOralFluencyScore] = useState<
    number | null
  >(null);
  const [localClassificationLevel, setLocalClassificationLevel] = useState<
    string | null
  >(null);
  const [localBehaviors, setLocalBehaviors] = useState<
    OralFluencyBehaviorData[] | null
  >(null);

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
    const miscues: OralFluencyMiscue[] =
      assessment?.oralFluency?.miscues ?? [];
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
  const activeBehaviors =
    localBehaviors ?? assessment?.oralFluency?.behaviors ?? [];

  const invalidateAssessments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["assessments", studentId] });
  }, [queryClient, studentId]);

  const editMiscues = useEditMiscues({
    originalMiscues: activeMiscues,
    totalWords,
    sessionId,
    onSave: (editedMiscues, metrics) => {
      setLocalMiscues(editedMiscues);
      setLocalTotalMiscues(metrics.totalMiscues);
      setLocalOralFluencyScore(metrics.oralFluencyScore);
      setLocalClassificationLevel(metrics.classificationLevel);
      invalidateAssessments();
    },
  });

  const handleDeleteMiscue = useCallback(
    async (miscue: MiscueResult) => {
      if (!sessionId) return;
      const dbResult = await fetchOralFluencyMiscues(sessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = findMatchingDbMiscue(dbResult.data, miscue);
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "delete",
      });
      if (!result.success || !result.updatedMetrics) return;
      const sourceMiscues = editMiscues.isEditing
        ? editMiscues.editedMiscues
        : activeMiscues;
      const updated = removeFirstMatchingMiscue(sourceMiscues, miscue);
      editMiscues.applyExternalMiscues(updated);
      setLocalMiscues(updated);
      setLocalTotalMiscues(result.updatedMetrics.totalMiscues);
      setLocalOralFluencyScore(result.updatedMetrics.oralFluencyScore);
      setLocalClassificationLevel(result.updatedMetrics.classificationLevel);
      invalidateAssessments();
    },
    [sessionId, activeMiscues, invalidateAssessments, editMiscues],
  );

  const handleUpdateMiscueType = useCallback(
    async (miscue: MiscueResult, newType: MiscueResult["miscueType"]) => {
      if (!sessionId) return;
      const dbResult = await fetchOralFluencyMiscues(sessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = findMatchingDbMiscue(dbResult.data, miscue);
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "update",
        newMiscueType: newType,
      });
      if (!result.success || !result.updatedMetrics) return;
      const sourceMiscues = editMiscues.isEditing
        ? editMiscues.editedMiscues
        : activeMiscues;
      const updated = updateFirstMatchingMiscueType(
        sourceMiscues,
        miscue,
        newType,
      );
      editMiscues.applyExternalMiscues(updated);
      setLocalMiscues(updated);
      setLocalTotalMiscues(result.updatedMetrics.totalMiscues);
      setLocalOralFluencyScore(result.updatedMetrics.oralFluencyScore);
      setLocalClassificationLevel(result.updatedMetrics.classificationLevel);
      invalidateAssessments();
    },
    [sessionId, activeMiscues, invalidateAssessments, editMiscues],
  );

  const handleUpdateSpokenWord = useCallback(
    async (miscue: MiscueResult, newSpokenWord: string) => {
      if (!sessionId) return;
      const dbResult = await fetchOralFluencyMiscues(sessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = findMatchingDbMiscue(dbResult.data, miscue);
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "update",
        newSpokenWord,
      });
      if (!result.success || !result.updatedMetrics) return;
      const sourceMiscues = editMiscues.isEditing
        ? editMiscues.editedMiscues
        : activeMiscues;
      const updated = updateFirstMatchingSpokenWord(
        sourceMiscues,
        miscue,
        newSpokenWord,
      );
      editMiscues.applyExternalMiscues(updated);
      setLocalMiscues(updated);
      setLocalTotalMiscues(result.updatedMetrics.totalMiscues);
      setLocalOralFluencyScore(result.updatedMetrics.oralFluencyScore);
      setLocalClassificationLevel(result.updatedMetrics.classificationLevel);
      invalidateAssessments();
    },
    [sessionId, activeMiscues, invalidateAssessments, editMiscues],
  );

  const handleSaveBehaviors = useCallback(
    async (behaviorTypes: BehaviorType[]) => {
      if (!sessionId) return;
      const result = await updateBehaviorsAction({
        sessionId,
        behaviorTypes,
      });
      if (!result.success) return;

      setLocalBehaviors(
        behaviorTypes.map((behaviorType) => ({
          id: `${sessionId}:${behaviorType}`,
          behaviorType,
        })),
      );
      invalidateAssessments();
    },
    [sessionId, invalidateAssessments],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
              <LayoutDashboard size={20} className="text-[#5D5DFB]" />
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
              Oral Fluency Test Report
            </h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">
              Loading report...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
              <LayoutDashboard size={20} className="text-[#5D5DFB]" />
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
              Oral Fluency Test Report
            </h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-[#00306E] font-semibold text-lg">
              No report data found.
            </p>
            <p className="text-[#00306E]/60 text-sm">
              Please complete an assessment session first.
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg bg-[#6666FF] px-6 py-2 text-sm font-semibold text-white hover:bg-[#5555EE] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTotalMiscues =
    localTotalMiscues ?? (assessment.oralFluency?.totalMiscues ?? 0);
  const currentOralFluencyScore =
    localOralFluencyScore ?? (assessment.oralFluency?.oralFluencyScore ?? 0);
  const currentClassificationLevel =
    localClassificationLevel ??
    (assessment.oralFluency?.classificationLevel ?? "");
  const duration = assessment.oralFluency?.duration ?? 0;
  const wordsCorrect = Math.max(0, totalWords - currentTotalMiscues);
  const wcpm =
    duration > 0 ? Math.round((wordsCorrect / duration) * 60) : 0;

  const miscueData = buildMiscueData(
    activeMiscues,
    currentTotalMiscues,
    currentOralFluencyScore,
    currentClassificationLevel,
  );

  const studentName = assessment.student?.name ?? "";
  const gradeLevel = assessment.student?.level
    ? `Grade ${assessment.student.level}`
    : "";
  const passage = assessment.passage;
  const numberOfWords = passage?.content
    ? passage.content.split(/\s+/).filter(Boolean).length
    : (assessment.oralFluency?.totalWords ?? 0);

  const behaviorItems = buildBehaviorItems(activeBehaviors);

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
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard size={20} className="text-[#5D5DFB]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
              Oral Fluency Test Report
            </h1>
            {assessmentId && (
              <p className="text-xs font-medium text-[#2E2E68]/65">
                Assessment ID:{" "}
                <span className="font-semibold text-[#2E2E68]">
                  {assessmentId}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav row: Previous (purple bg rounded) on left, Export PDF on right */}
      <div className="flex items-center justify-between px-8 pt-5 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(102,102,255,0.4),0_4px_12px_rgba(102,102,255,0.3)] transition-all hover:bg-[#5555EE]"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export to PDF
          </button>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-300 mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
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

        {/* Three-column row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6">
            <PassageInfoCard
              passageTitle={passage?.title ?? "—"}
              passageLevel={
                passage?.level ? `Grade ${passage.level}` : "—"
              }
              numberOfWords={numberOfWords}
              testType={formatTestType(passage?.testType)}
              assessmentType={assessmentTypeLabel}
            />
            <AudioPlaybackCard
              audioSrc={assessment.oralFluency?.audioUrl}
            />
          </div>

          <BehaviorChecklist
            behaviors={behaviorItems}
            onSave={sessionId ? handleSaveBehaviors : undefined}
          />

          <MiscueAnalysisReport
            miscueData={miscueData}
            onViewMiscues={() => setShowMiscuesModal(true)}
            onEditMiscues={() => setShowEditModal(true)}
          />
        </div>
      </main>

      {/* View Miscues Modal */}
      <ViewMiscuesModal
        open={showMiscuesModal}
        onClose={() => setShowMiscuesModal(false)}
        passageContent={passage?.content ?? ""}
        miscues={activeMiscues}
        alignedWords={undefined}
        passageLevel={
          passage?.level ? `Grade ${passage.level}` : undefined
        }
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
                onDeleteMiscue={
                  sessionId ? handleDeleteMiscue : undefined
                }
                onUpdateMiscueType={
                  sessionId ? handleUpdateMiscueType : undefined
                }
                onUpdateSpokenWord={
                  sessionId ? handleUpdateSpokenWord : undefined
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
