"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ReportHeader from "@/components/reports/oral-reading-test/reading-fluency-report/reportHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import ViewMiscuesModal from "@/components/reports/oral-reading-test/reading-fluency-report/viewMiscuesModal";
import type { MiscueData } from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type {
  OralFluencyAnalysis,
  MiscueResult,
  BehaviorResult,
} from "@/types/oral-reading";
import { exportFluencyReportPdf } from "@/lib/exportFluencyReportPdf";
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay";
import { useEditMiscues } from "@/components/oral-reading-test/useEditMiscues";
import { fetchOralFluencyMiscues } from "@/app/actions/oral-fluency/getMiscues";
import { updateMiscueAction } from "@/app/actions/oral-fluency/updateMiscue";

const STORAGE_KEY = "oral-reading-session";
const AUDIO_STORAGE_KEY = "oral-reading-audio";

function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "audio/wav";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

interface SessionState {
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
  passageContent: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  selectedTestType?: string;
  selectedTitle?: string;
  recordedSeconds: number;
  analysisResult?: OralFluencyAnalysis | null;
  sessionId?: string;
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load session:", err);
  }
  return {};
}

function countMiscuesByType(miscues: MiscueResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
  }
  return counts;
}

function buildMiscueData(
  analysis: OralFluencyAnalysis | null | undefined,
): MiscueData {
  if (!analysis) {
    return {
      mispronunciation: 0,
      omission: 0,
      substitution: 0,
      transposition: 0,
      reversal: 0,
      insertion: 0,
      repetition: 0,
      selfCorrection: 0,
      totalMiscue: 0,
      oralFluencyScore: "—",
      classificationLevel: "—",
    };
  }

  const counts = countMiscuesByType(analysis.miscues);

  return {
    mispronunciation: counts["MISPRONUNCIATION"] || 0,
    omission: counts["OMISSION"] || 0,
    substitution: counts["SUBSTITUTION"] || 0,
    transposition: counts["TRANSPOSITION"] || 0,
    reversal: counts["REVERSAL"] || 0,
    insertion: counts["INSERTION"] || 0,
    repetition: counts["REPETITION"] || 0,
    selfCorrection: counts["SELF_CORRECTION"] || 0,
    totalMiscue: analysis.totalMiscues,
    oralFluencyScore: `${analysis.oralFluencyScore}%`,
    classificationLevel: analysis.classificationLevel,
  };
}

function buildBehaviorItems(
  analysis: OralFluencyAnalysis | null | undefined,
): BehaviorItem[] {
  const detectedTypes = new Set(
    (analysis?.behaviors || []).map((b: BehaviorResult) => b.behaviorType),
  );

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
    },
  ];
}

export default function OralReadingReportPage() {
  const router = useRouter();
  const [showMiscuesModal, setShowMiscuesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<OralFluencyAnalysis | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const session = useMemo(() => (isClient ? loadSession() : {}), [isClient]);
  const analysis = localAnalysis ?? session.analysisResult;

  const audioSrc = useMemo(() => {
    if (!isClient) return null;
    try {
      const audioBase64 = sessionStorage.getItem(AUDIO_STORAGE_KEY);
      if (!audioBase64) return null;
      const blob = base64ToBlob(audioBase64);
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [isClient]);

  useEffect(() => {
    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [audioSrc]);

  const studentName = session.studentName || "—";
  const gradeLevel = useMemo(
    () => (session.gradeLevel ? `Grade ${session.gradeLevel}` : "—"),
    [session.gradeLevel],
  );
  const studentClass = session.selectedClassName || "—";
  const passageTitle = session.selectedTitle || "—";
  const passageLevel = session.selectedLevel || "—";
  const testType = session.selectedTestType || "—";

  const totalWords = useMemo(
    () =>
      session.passageContent
        ? session.passageContent.split(/\s+/).filter(Boolean).length
        : 0,
    [session.passageContent],
  );

  const readingTimeSeconds = useMemo(
    () => Math.round(analysis?.duration ?? session.recordedSeconds ?? 0),
    [analysis?.duration, session.recordedSeconds],
  );

  const totalMiscues = analysis?.totalMiscues ?? 0;
  const wordsCorrect = Math.max(0, totalWords - totalMiscues);
  const wcpm = useMemo(
    () =>
      readingTimeSeconds > 0
        ? Math.round((wordsCorrect / readingTimeSeconds) * 60)
        : 0,
    [wordsCorrect, readingTimeSeconds],
  );

  const classification = analysis?.classificationLevel || "—";
  const miscueData = useMemo(() => buildMiscueData(analysis), [analysis]);
  const behaviorItems = useMemo(() => buildBehaviorItems(analysis), [analysis]);

  const editMiscues = useEditMiscues({
    originalMiscues: analysis?.miscues ?? [],
    totalWords,
    sessionId: session.sessionId ?? undefined,
    onSave: (editedMiscues, metrics) => {
      setLocalAnalysis((prev) => {
        const base = prev ?? (analysis as OralFluencyAnalysis);
        return {
          ...base,
          miscues: editedMiscues,
          totalMiscues: metrics.totalMiscues,
          oralFluencyScore: metrics.oralFluencyScore,
          classificationLevel: metrics.classificationLevel as OralFluencyAnalysis["classificationLevel"],
        };
      });
      // Persist to sessionStorage
      try {
        const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
        if (sessionRaw) {
          const s = JSON.parse(sessionRaw);
          if (s.analysisResult) {
            s.analysisResult.miscues = editedMiscues;
            s.analysisResult.totalMiscues = metrics.totalMiscues;
            s.analysisResult.oralFluencyScore = metrics.oralFluencyScore;
            s.analysisResult.classificationLevel = metrics.classificationLevel;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
          }
        }
      } catch {}
    },
  });

  const reportSessionId = session.sessionId;

  const handleApproveMiscue = useCallback(
    async (miscue: MiscueResult) => {
      if (!reportSessionId) return;
      const dbResult = await fetchOralFluencyMiscues(reportSessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = dbResult.data.find(
        (m) =>
          m.wordIndex === miscue.wordIndex &&
          m.miscueType === miscue.miscueType &&
          m.expectedWord === miscue.expectedWord
      );
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "approve",
      });
      if (!result.success) return;
      setLocalAnalysis((prev) => {
        const base = prev ?? (analysis as OralFluencyAnalysis);
        const updated = {
          ...base,
          miscues: base.miscues.filter(
            (m) =>
              !(
                m.wordIndex === miscue.wordIndex &&
                m.miscueType === miscue.miscueType &&
                m.expectedWord === miscue.expectedWord
              )
          ),
          totalMiscues: result.updatedMetrics!.totalMiscues,
          oralFluencyScore: result.updatedMetrics!.oralFluencyScore,
          classificationLevel: result.updatedMetrics!.classificationLevel as OralFluencyAnalysis["classificationLevel"],
        };
        try {
          const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
          if (sessionRaw) {
            const s = JSON.parse(sessionRaw);
            if (s.analysisResult) {
              s.analysisResult.miscues = updated.miscues;
              s.analysisResult.totalMiscues = updated.totalMiscues;
              s.analysisResult.oralFluencyScore = updated.oralFluencyScore;
              s.analysisResult.classificationLevel = updated.classificationLevel;
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
            }
          }
        } catch {}
        return updated;
      });
    },
    [reportSessionId, analysis]
  );

  const handleUpdateMiscueType = useCallback(
    async (miscue: MiscueResult, newType: MiscueResult["miscueType"]) => {
      if (!reportSessionId) return;
      const dbResult = await fetchOralFluencyMiscues(reportSessionId);
      if (!dbResult.success || !dbResult.data) return;
      const match = dbResult.data.find(
        (m) =>
          m.wordIndex === miscue.wordIndex &&
          m.miscueType === miscue.miscueType &&
          m.expectedWord === miscue.expectedWord
      );
      if (!match?.id) return;
      const result = await updateMiscueAction({
        miscueId: match.id,
        action: "update",
        newMiscueType: newType,
      });
      if (!result.success) return;
      setLocalAnalysis((prev) => {
        const base = prev ?? (analysis as OralFluencyAnalysis);
        const updated = {
          ...base,
          miscues: base.miscues.map((m) =>
            m.wordIndex === miscue.wordIndex &&
            m.miscueType === miscue.miscueType &&
            m.expectedWord === miscue.expectedWord
              ? { ...m, miscueType: newType }
              : m
          ),
          totalMiscues: result.updatedMetrics!.totalMiscues,
          oralFluencyScore: result.updatedMetrics!.oralFluencyScore,
          classificationLevel: result.updatedMetrics!.classificationLevel as OralFluencyAnalysis["classificationLevel"],
        };
        try {
          const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
          if (sessionRaw) {
            const s = JSON.parse(sessionRaw);
            if (s.analysisResult) {
              s.analysisResult.miscues = updated.miscues;
              s.analysisResult.totalMiscues = updated.totalMiscues;
              s.analysisResult.oralFluencyScore = updated.oralFluencyScore;
              s.analysisResult.classificationLevel = updated.classificationLevel;
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
            }
          }
        } catch {}
        return updated;
      });
    },
    [reportSessionId, analysis]
  );

  const handleExportPdf = useCallback(() => {
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    exportFluencyReportPdf(
      {
        studentName,
        gradeLevel,
        className: studentClass,
        passageTitle,
        passageLevel,
        numberOfWords: totalWords,
        testType,
        assessmentType: "Oral Reading",
        wcpm,
        readingTimeSeconds,
        classificationLevel: classification,
        miscueData,
        behaviors: behaviorItems.map((b) => ({
          label: b.label,
          description: b.description,
          checked: b.checked ?? false,
        })),
      },
      `Oral_Fluency_Report_${safeName}`,
    );
  }, [
    studentName,
    gradeLevel,
    studentClass,
    passageTitle,
    passageLevel,
    totalWords,
    testType,
    wcpm,
    readingTimeSeconds,
    classification,
    miscueData,
    behaviorItems,
  ]);

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <ReportHeader />
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

  if (!analysis) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <ReportHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-[#00306E] font-semibold text-lg">
              No report data found.
            </p>
            <p className="text-[#00306E]/60 text-sm">
              Please complete an oral reading session first.
            </p>
            <button
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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ReportHeader onExportPdf={handleExportPdf} />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-300 mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard
            studentName={studentName}
            gradeLevel={gradeLevel}
            className={studentClass}
          />
          <MetricCards
            wcpm={wcpm}
            readingTimeSeconds={readingTimeSeconds}
            classificationLevel={classification}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <PassageInfoCard
              passageTitle={passageTitle}
              passageLevel={passageLevel}
              numberOfWords={totalWords}
              testType={testType}
              assessmentType="Oral Reading"
            />
            <AudioPlaybackCard audioSrc={audioSrc} />
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
        passageContent={session.passageContent || ""}
        miscues={analysis?.miscues || []}
        alignedWords={analysis?.alignedWords}
        passageLevel={session.selectedLevel}
      />

      {/* Edit Miscues Modal */}
      {showEditModal && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-[#003366]">
              Edit Miscues
            </h2>
            <div className="flex-1 overflow-auto">
              <PassageDisplay
                content={session.passageContent || ""}
                miscues={
                  editMiscues.isEditing
                    ? editMiscues.editedMiscues
                    : analysis?.miscues
                }
                alignedWords={analysis?.alignedWords}
                passageLevel={session.selectedLevel}
                expanded
                resizable={false}
                editMode={editMiscues}
                onApproveMiscue={reportSessionId ? handleApproveMiscue : undefined}
                onUpdateMiscueType={reportSessionId ? handleUpdateMiscueType : undefined}
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
