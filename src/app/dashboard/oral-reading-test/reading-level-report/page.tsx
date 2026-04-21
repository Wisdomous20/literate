// src/app/dashboard/oral-reading-test/reading-level-report/page.tsx
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  FileText,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import type { OralFluencyAnalysis } from "@/types/oral-reading";
import { DeleteConfirmModal } from "@/components/ui/deleteConfirmModal";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import {
  buildFluencyReportData,
  exportFluencyReportPdf,
} from "@/lib/exportFluencyReportPdf";
import { exportComprehensionReportPdf } from "@/lib/exportComprehensionReportPdf";
import { useAssessmentById } from "@/lib/hooks/useAssessmentById";

const STORAGE_KEY = "oral-reading-session";

interface ComprehensionResult {
  score: number;
  totalItems: number;
  percentage: number;
  level: string;
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
  comprehensionResult?: ComprehensionResult | null;
  oralReadingLevel?: string | null;
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* empty */
  }
  return {};
}

function formatLevel(level: string | undefined | null): string {
  if (!level) return "—";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getLevelColor(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "text-emerald-600";
    case "instructional":
      return "text-blue-600";
    case "frustration":
      return "text-red-500";
    default:
      return "text-[#00306E]";
  }
}

function getProgressBarColor(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "bg-emerald-400";
    case "instructional":
      return "bg-blue-400";
    case "frustration":
      return "bg-red-400";
    default:
      return "bg-emerald-400";
  }
}

function getClassificationSubtext(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "Student demonstrates strong reading ability across all areas.";
    case "instructional":
      return "Student is on track with appropriate instructional support.";
    case "frustration":
      return "Student requires intensive support to improve reading skills.";
    default:
      return "Student demonstrates strong reading ability across all areas.";
  }
}

function getWidthClass(percent: number) {
  if (percent >= 100) return "w-full";
  if (percent >= 75) return "w-3/4";
  if (percent >= 50) return "w-1/2";
  if (percent >= 25) return "w-1/4";
  return "w-0";
}

export default function ReadingLevelReportPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const session = loadSession();
  const [overallLevelState, setOverallLevelState] = useState<string | null>(
    session.oralReadingLevel ?? null,
  );

  useEffect(() => {
    if (overallLevelState) return;

    const assessmentId = sessionStorage.getItem("oral-reading-assessmentId");
    if (!assessmentId) return;

    const poll = setInterval(async () => {
      try {
        const { getAssessmentByIdAction } =
          await import("@/app/actions/assessment/getAssessmentById");
        const assessment = (await getAssessmentByIdAction(
          assessmentId,
        )) as Record<string, unknown>;

        if (
          assessment?.oralReadingResult &&
          typeof assessment.oralReadingResult === "object"
        ) {
          const oralResult = assessment.oralReadingResult as Record<
            string,
            unknown
          >;
          if (oralResult.classificationLevel) {
            clearInterval(poll);
            const level = oralResult.classificationLevel as string;
            setOverallLevelState(level);

            const raw = sessionStorage.getItem("oral-reading-session");
            if (raw) {
              const s = JSON.parse(raw);
              s.oralReadingLevel = level;
              sessionStorage.setItem("oral-reading-session", JSON.stringify(s));
            }
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(poll);
  }, [overallLevelState]);

  const assessmentId = useMemo(() => {
    if (!isClient) return null;
    return sessionStorage.getItem("oral-reading-assessmentId");
  }, [isClient]);

  const { data: assessment } = useAssessmentById(assessmentId);

  const handleExportPdf = useCallback(() => {
    const safeName = (session.studentName || "Unknown").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );

    if (session.analysisResult && session.passageContent) {
      const fluencyData = buildFluencyReportData({
        studentName: session.studentName || "Unknown",
        gradeLevel: session.gradeLevel || "",
        selectedClassName: session.selectedClassName || "",
        selectedTitle: session.selectedTitle,
        selectedLevel: session.selectedLevel,
        selectedTestType: session.selectedTestType,
        assessmentType: "Oral Reading",
        passageContent: session.passageContent,
        recordedSeconds: session.recordedSeconds || 0,
        analysisResult: session.analysisResult,
      });
      exportFluencyReportPdf(fluencyData, `Oral_Fluency_Report_${safeName}`);
    }

    const test = (assessment as Record<string, unknown>)?.comprehension as
      | Record<string, unknown>
      | undefined;
    const passage = (assessment as Record<string, unknown>)?.passage as
      | Record<string, unknown>
      | undefined;
    if (test) {
      const answers = test.answers as Array<{
        tag: string;
        isCorrect: boolean;
      }>;
      const tagBreakdown = {
        literal: { correct: 0, total: 0 },
        inferential: { correct: 0, total: 0 },
        critical: { correct: 0, total: 0 },
      };
      for (const answer of answers) {
        const tag = answer.tag;
        if (tag === "Literal") {
          tagBreakdown.literal.total++;
          if (answer.isCorrect) tagBreakdown.literal.correct++;
        } else if (tag === "Inferential") {
          tagBreakdown.inferential.total++;
          if (answer.isCorrect) tagBreakdown.inferential.correct++;
        } else if (tag === "Critical") {
          tagBreakdown.critical.total++;
          if (answer.isCorrect) tagBreakdown.critical.correct++;
        }
      }
      const score = test.score as number;
      const totalItems = test.totalItems as number;
      const percentage =
        totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;

      setTimeout(() => {
        exportComprehensionReportPdf(
          {
            studentName: session.studentName || "Unknown",
            gradeLevel: session.gradeLevel || "Unknown",
            className: session.selectedClassName || "Unknown",
            passageTitle: (passage?.title as string) || "Unknown",
            passageLevel: String(passage?.level ?? ""),
            numberOfWords: ((passage?.content as string) || "")
              .split(/\s+/)
              .filter(Boolean).length,
            testType: (passage?.testType as string) || "Unknown",
            assessmentType: "Oral Reading Test",
            score,
            totalItems,
            percentage,
            classificationLevel: test.classificationLevel as string,
            literal: tagBreakdown.literal,
            inferential: tagBreakdown.inferential,
            critical: tagBreakdown.critical,
          },
          `Comprehension_Report_${safeName}`,
        );
      }, 500);
    }
  }, [session, assessment]);

  // Loading state
  if (!isHydrated) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <DashboardHeader title="Reading Level" schoolYear="" />
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

  // No data state
  if (!session.analysisResult && !session.comprehensionResult) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <DashboardHeader title="Reading Level" schoolYear="" />
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
              className="rounded-lg bg-[#297CEC] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const analysisResult = session.analysisResult;
  const fluencyLevel = formatLevel(analysisResult?.classificationLevel);
  const fluencyPercent = analysisResult?.oralFluencyScore ?? 0;

  const comprehensionResult = session.comprehensionResult;
  const comprehensionLevel = formatLevel(comprehensionResult?.level);
  const comprehensionPercent = comprehensionResult?.totalItems
    ? Math.round(
        (comprehensionResult.score / comprehensionResult.totalItems) * 100,
      )
    : 0;

  const overallLevel = formatLevel(
    overallLevelState ?? session.oralReadingLevel,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Reading Level" schoolYear="" />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 lg:px-8">
        <div className="rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] h-full flex flex-col">
          {/* Top bar — indigo header with back button, student info, export */}
          <div className="px-6 py-4 bg-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white hover:bg-[#9333EA] transition-all shadow-sm active:scale-95"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-black uppercase tracking-widest">
                      {session.gradeLevel
                        ? `Grade ${session.gradeLevel}`
                        : "—"}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-black bg-indigo-100">
                      Oral Reading Test
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-black leading-tight">
                    {session.studentName || "Unknown Student"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportPdf}
                  className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  type="button"
                >
                  Export to PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-lg bg-[#DE3B40] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <DeleteConfirmModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              /* TODO */
            }}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Overall Reading Level Banner */}
            {overallLevel && overallLevel !== "—" && (
              <div className="relative rounded-2xl overflow-hidden mb-6 h-48">
                <div className="absolute inset-0 bg-[url('/images/Class-bg.png')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-linear-to-r from-[#6666FF]/90 to-[#6666FF]/75" />

                <div className="relative h-full flex items-center justify-between px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-white" />
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">
                        Reading Level
                      </span>
                    </div>
                    <span className="text-xs text-white/80">
                      Based on all assessments
                    </span>
                    <h2 className="text-4xl font-extrabold text-white mt-2">
                      {overallLevel}
                    </h2>
                    <p className="text-sm text-white/90 mt-2 max-w-sm">
                      {getClassificationSubtext(overallLevel)}
                    </p>
                  </div>

                  <div className="relative -mr-8">
                    <Image
                      src="/images/Class.png"
                      alt="Student mascot"
                      width={200}
                      height={200}
                      className="h-auto w-auto"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[#E5E7EB] my-6" />

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Oral Fluency Test Report Card */}
              <div
                className="
                  rounded-xl overflow-hidden
                  border-l-2 border-t-2 border-r-4 border-b-4
                  border-l-[#E5E7EB] border-t-[#E5E7EB]
                  border-r-[#2E2E68] border-b-[#2E2E68]
                "
              >
                <div className="bg-white p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col">
                      <h3 className="text-base font-bold text-[#00306E]">
                        Oral Fluency Test Report
                      </h3>
                      <span className="text-xs text-[#00306E]/60 mt-1">
                        Based on all assessments
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          "/dashboard/oral-reading-test/reading-fluency-report",
                        )
                      }
                      className="rounded-full bg-[#A855F7] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#9333EA] transition whitespace-nowrap"
                      type="button"
                      aria-label="View Oral Fluency Test report"
                    >
                      View Report
                    </button>
                  </div>

                  <div className="mb-4">
                    <span
                      className={`text-lg font-bold ${getLevelColor(fluencyLevel)}`}
                    >
                      {fluencyLevel}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(fluencyLevel)} transition-all duration-700 ${getWidthClass(fluencyPercent)}`}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-[#00306E]">
                        {fluencyPercent > 0 ? `${Math.round(fluencyPercent)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reading Comprehension Test Report Card */}
              <div
                className="
                  rounded-xl overflow-hidden
                  border-l-2 border-t-2 border-r-4 border-b-4
                  border-l-[#E5E7EB] border-t-[#E5E7EB]
                  border-r-[#2E2E68] border-b-[#2E2E68]
                "
              >
                <div className="bg-white p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col">
                      <h3 className="text-base font-bold text-[#00306E]">
                        Reading Comprehension Test Report
                      </h3>
                      <span className="text-xs text-[#00306E]/60 mt-1">
                        Based on all assessments
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          "/dashboard/oral-reading-test/comprehension/report",
                        )
                      }
                      className="rounded-full bg-[#A855F7] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#9333EA] transition whitespace-nowrap"
                      type="button"
                      aria-label="View Reading Comprehension Test report"
                    >
                      View Report
                    </button>
                  </div>

                  <div className="mb-4">
                    <span
                      className={`text-lg font-bold ${getLevelColor(comprehensionLevel)}`}
                    >
                      {comprehensionLevel}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(comprehensionLevel)} transition-all duration-700 ${getWidthClass(comprehensionPercent)}`}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-[#00306E]">
                        {comprehensionPercent > 0
                          ? `${Math.round(comprehensionPercent)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}