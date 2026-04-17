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
  LayoutDashboard,
  ChevronLeft,
  FileText,
  ClipboardCheck,
  Loader2,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import type { OralFluencyAnalysis } from "@/types/oral-reading";
import { DeleteConfirmModal } from "@/components/ui/deleteConfirmModal";
import { NavButton } from "@/components/ui/navButton";
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

function getLevelStyle(level: string) {
  switch (level.toLowerCase()) {
    case "independent":
      return {
        text: "text-[#0F8B3A]",
        bg: "bg-[#D4F6DF]",
        border: "border-[#0F8B3A]/30",
        raw: "#0F8B3A",
        gradient: "from-[#34D399] to-[#10B981]",
        barColor: "bg-[#10B981]",
        description:
          "Student demonstrates strong reading ability across all areas.",
      };
    case "instructional":
      return {
        text: "text-[#297CEC]",
        bg: "bg-[#EAF3FF]",
        border: "border-[#297CEC]/30",
        raw: "#297CEC",
        gradient: "from-[#818CF8] to-[#6366F1]",
        barColor: "bg-[#6366F1]",
        description:
          "Student shows developing skills that benefit from guided instruction.",
      };
    case "frustration":
      return {
        text: "text-[#CE330C]",
        bg: "bg-[#F6D1D2]",
        border: "border-[#CE330C]/30",
        raw: "#CE330C",
        gradient: "from-[#FB923C] to-[#F97316]",
        barColor: "bg-[#F97316]",
        description:
          "Student needs additional support to build reading confidence.",
      };
    default:
      return {
        text: "text-[#2E2E68]",
        bg: "bg-[#E8E8FF]",
        border: "border-[#54A4FF]",
        raw: "#2E2E68",
        gradient: "from-[#818CF8] to-[#6366F1]",
        barColor: "bg-[#6366F1]",
        description: "Assessment in progress.",
      };
  }
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

  if (!isHydrated) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#E4F4FF]">
        <div className="flex items-center gap-3 px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard size={20} className="text-[#5D5DFB]" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Oral Reading Test
          </h1>
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

  if (!session.analysisResult && !session.comprehensionResult) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#E4F4FF]">
        <div className="flex items-center gap-3 px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard size={20} className="text-[#5D5DFB]" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Oral Reading Test
          </h1>
        </div>
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
              className="rounded-lg bg-[#2E2E68] px-6 py-2 text-sm font-semibold text-white hover:bg-[#2E2E68]/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const analysisResult = session.analysisResult;
  const fluencyScore =
    analysisResult?.oralFluencyScore != null
      ? `${analysisResult.oralFluencyScore}%`
      : "—";
  const fluencyLevel = formatLevel(analysisResult?.classificationLevel);

  const comprehensionResult = session.comprehensionResult;
  const comprehensionScore = comprehensionResult?.totalItems
    ? `${Math.round((comprehensionResult.score / comprehensionResult.totalItems) * 100)}%`
    : "—";
  const comprehensionLevel = formatLevel(comprehensionResult?.level);

  const overallLevel = formatLevel(
    overallLevelState ?? session.oralReadingLevel,
  );
  const fluencyStyle = getLevelStyle(fluencyLevel);
  const comprehensionStyle = getLevelStyle(comprehensionLevel);
  const overallStyle = getLevelStyle(overallLevel);

  const fluencyPercent = analysisResult?.oralFluencyScore ?? 0;
  const comprehensionPercent = comprehensionResult?.totalItems
    ? Math.round(
        (comprehensionResult.score / comprehensionResult.totalItems) * 100,
      )
    : 0;

  function getWidthClass(percent: number) {
    if (percent >= 100) return "w-full";
    if (percent >= 96) return "w-[96%]";
    if (percent >= 90) return "w-11/12";
    if (percent >= 83) return "w-10/12";
    if (percent >= 75) return "w-9/12";
    if (percent >= 66) return "w-8/12";
    if (percent >= 58) return "w-7/12";
    if (percent >= 50) return "w-6/12";
    if (percent >= 41) return "w-5/12";
    if (percent >= 33) return "w-4/12";
    if (percent >= 25) return "w-3/12";
    if (percent >= 16) return "w-2/12";
    if (percent > 0) return "w-1/12";
    return "w-0";
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#E4F4FF]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5D5DFB]/10">
            <LayoutDashboard size={20} className="text-[#5D5DFB]" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Oral Reading Test
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
          >
            Export to PDF
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 bg-[#DE3B40] text-white text-xs font-medium rounded-lg border border-[#DE3B40] hover:bg-[#DE3B40]/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          /* TODO */
        }}
      />

      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <NavButton onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </NavButton>
        <NavButton
          variant="outlined"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem("oral-reading-audio");
            sessionStorage.removeItem("oral-reading-assessmentId");
            sessionStorage.removeItem("oral-reading-comprehension-state");
            sessionStorage.removeItem("oral-reading-comprehensionTestId");
            router.push("/dashboard/oral-reading-test");
          }}
        >
          <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
          <span>Start New</span>
        </NavButton>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-8 py-6 md:px-12 lg:px-16 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-250 mx-auto space-y-6">
          {/* Student Info + Grade Badge */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#5D5DFB]/10 px-3 py-1 text-xs font-semibold text-[#5D5DFB] border border-[#5D5DFB]/20">
              GRADE {session.gradeLevel || "—"}
            </span>
            <span className="rounded-full bg-[#5D5DFB]/10 px-3 py-1 text-xs font-semibold text-[#5D5DFB] border border-[#5D5DFB]/20">
              Oral Reading Test
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#00306E]">
            {session.studentName || "Unknown Student"}
          </h2>

          {/* Overall Reading Level Banner */}
          <div
            className={`relative overflow-hidden rounded-3xl bg-linear-to-r ${overallStyle.gradient} p-8 text-white`}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">
                    Reading Level
                  </span>
                </div>
                <p className="text-xs text-white/70 mb-2">
                  Based on all assessments
                </p>
                <h3 className="text-4xl font-bold uppercase tracking-wide">
                  {overallLevel}
                </h3>
                <p className="mt-2 text-sm text-white/80 max-w-md">
                  {overallStyle.description}
                </p>
              </div>
              <div className="relative h-40 w-40 shrink-0 hidden md:block">
                <Image
                  src="/images/bee.png"
                  alt="LiteRate Mascot"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Oral Fluency Test Report Card */}
            <div className="flex flex-col bg-white border-2 border-[#54A4FF] rounded-3xl p-8 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-xl">
                    <FileText size={22} className="text-[#1A6673]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#003366]">
                      Oral Fluency Test Report
                    </h2>
                    <p className="text-xs text-[#6B7DB3]">
                      Based on all assessments
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      "/dashboard/oral-reading-test/reading-fluency-report",
                    )
                  }
                  className="px-4 py-1.5 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] hover:bg-[#2E2E68]/90 transition-colors"
                >
                  View Report
                </button>
              </div>

              <p
                className={`text-2xl font-bold uppercase ${fluencyStyle.text}`}
              >
                {fluencyLevel}
              </p>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${fluencyStyle.barColor} transition-all duration-700 ${getWidthClass(fluencyPercent)}`}
                  />
                </div>
                <span className="text-2xl font-bold text-[#1A6673] tabular-nums">
                  {fluencyScore}
                </span>
              </div>
            </div>

            {/* Reading Comprehension Test Report Card */}
            <div className="flex flex-col bg-white border-2 border-[#54A4FF] rounded-3xl p-8 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-xl">
                    <ClipboardCheck size={22} className="text-[#1A6673]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#003366]">
                      Reading Comprehension Test Report
                    </h2>
                    <p className="text-xs text-[#6B7DB3]">
                      Based on all assessments
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      "/dashboard/oral-reading-test/comprehension/report",
                    )
                  }
                  className="px-4 py-1.5 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] hover:bg-[#2E2E68]/90 transition-colors"
                >
                  View Report
                </button>
              </div>

              <p
                className={`text-2xl font-bold uppercase ${comprehensionStyle.text}`}
              >
                {comprehensionLevel}
              </p>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${comprehensionStyle.barColor} transition-all duration-700 ${getWidthClass(comprehensionPercent)}`}
                  />
                </div>
                <span className="text-2xl font-bold text-[#1A6673] tabular-nums">
                  {comprehensionScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
