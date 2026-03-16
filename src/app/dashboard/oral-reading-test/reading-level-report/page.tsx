"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  FileText,
  ClipboardCheck,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { OralFluencyAnalysis } from "@/types/oral-reading";
import { DeleteConfirmModal } from "@/components/ui/deleteConfirmModal";
import { NavButton } from "@/components/ui/navButton";
import { buildFluencyReportData, exportFluencyReportPdf } from "@/lib/exportFluencyReportPdf";
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

/** Format a LevelClassification enum value for display (e.g. "INDEPENDENT" → "Independent") */
function formatLevel(level: string | undefined | null): string {
  if (!level) return "—";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

/** Derive a color palette from the reading level classification */
function getLevelStyle(level: string) {
  switch (level.toLowerCase()) {
    case "independent":
      return {
        text: "text-[#0F8B3A]",
        bg: "bg-[#D4F6DF]",
        border: "border-[#54A4FF]",
        raw: "#0F8B3A",
      };
    case "instructional":
      return {
        text: "text-[#297CEC]",
        bg: "bg-[#EAF3FF]",
        border: "border-[#297CEC]",
        raw: "#297CEC",
      };
    case "frustration":
      return {
        text: "text-[#CE330C]",
        bg: "bg-[#F6D1D2]",
        border: "border-[#CE330C]",
        raw: "#CE330C",
      };
    default:
      return {
        text: "text-[#2E2E68]",
        bg: "bg-[#E8E8FF]",
        border: "border-[#54A4FF]",
        raw: "#2E2E68",
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
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional mount-time hydration flag for SSR */
    setIsHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const session = loadSession();

  // Fetch assessment data for comprehension breakdown
  const assessmentId = useMemo(() => {
    if (!isClient) return null;
    return sessionStorage.getItem("oral-reading-assessmentId");
  }, [isClient]);

  const { data: assessment } = useAssessmentById(assessmentId);

  const handleExportPdf = useCallback(() => {
    const safeName = (session.studentName || "Unknown").replace(/[^a-zA-Z0-9]/g, "_");

    // Export fluency report PDF
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const test = (assessment as any)?.comprehension;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passage = (assessment as any)?.passage;
    if (test) {
      const tagBreakdown = {
        literal: { correct: 0, total: 0 },
        inferential: { correct: 0, total: 0 },
        critical: { correct: 0, total: 0 },
      };
      for (const answer of test.answers) {
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
      const percentage = test.totalItems > 0
        ? Math.round((test.score / test.totalItems) * 100)
        : 0;

      setTimeout(() => {
        exportComprehensionReportPdf(
          {
            studentName: session.studentName || "Unknown",
            gradeLevel: session.gradeLevel || "Unknown",
            className: session.selectedClassName || "Unknown",
            passageTitle: passage?.title || "Unknown",
            passageLevel: String(passage?.level ?? ""),
            numberOfWords: passage?.content?.split(/\s+/).filter(Boolean).length ?? 0,
            testType: passage?.testType || "Unknown",
            assessmentType: "Oral Reading Test",
            score: test.score,
            totalItems: test.totalItems,
            percentage,
            classificationLevel: test.classificationLevel,
            literal: tagBreakdown.literal,
            inferential: tagBreakdown.inferential,
            critical: tagBreakdown.critical,
          },
          `Comprehension_Report_${safeName}`,
        );
      }, 500);
    }
  }, [session, assessment]);

  // Loading state — wait for client hydration before reading from sessionStorage
  if (!isHydrated) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#E4F4FF]">
        <div className="flex items-center gap-3 px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-[25px] font-semibold text-[#00306E] font-(family-name:--font-poppins)">
            Oral Reading Test Report
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state — no session data found
  if (!session.analysisResult && !session.comprehensionResult) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#E4F4FF]">
        <div className="flex items-center gap-3 px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-[25px] font-semibold text-[#00306E] font-(family-name:--font-poppins)">
            Oral Reading Test Report
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-[#00306E] font-semibold text-lg">No report data found.</p>
            <p className="text-[#00306E]/60 text-sm">Please complete an oral reading session first.</p>
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

  // Fluency data from analysisResult (stored by oral-reading-test page after fluency API call)
  const analysisResult = session.analysisResult;
  const fluencyScore =
    analysisResult?.oralFluencyScore != null
      ? `${analysisResult.oralFluencyScore}%`
      : "—";
  const fluencyLevel = formatLevel(analysisResult?.classificationLevel);

  // Comprehension data (stored by comprehension page after POST /api/oral-reading/comprehension)
  const comprehensionResult = session.comprehensionResult;
  const comprehensionScore = comprehensionResult?.totalItems
    ? `${Math.round((comprehensionResult.score / comprehensionResult.totalItems) * 100)}%`
    : "—";
  const comprehensionLevel = formatLevel(comprehensionResult?.level);

  // Overall oral reading level — computed by backend createOralReadingService,
  // returned in the comprehension API response and stored in session
  const overallLevel = formatLevel(session.oralReadingLevel);

  const fluencyStyle = getLevelStyle(fluencyLevel);
  const comprehensionStyle = getLevelStyle(comprehensionLevel);
  const overallStyle = getLevelStyle(overallLevel);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#E4F4FF]">
      {/* ── Header Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-[25px] font-semibold text-[#00306E] font-(family-name:--font-poppins)">
            Oral Reading Test Report
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-lg border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2 bg-[#DE3B40] text-white text-xs font-medium rounded-lg border border-[#DE3B40] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#DE3B40]/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { /* TODO: wire up actual delete handler */ }}
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

      {/* ── Main Content ─────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-8 py-6 md:px-12 lg:px-16 animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Report Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-250 mx-auto">
          {/* ── Oral Fluency Test Report Card ──────────────────── */}
          <div className="flex flex-col bg-[#FEFFFD] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-4xl p-8 gap-3">
            {/* Card header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12.25 h-12 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-[10px]">
                <FileText size={22} className="text-[#1A6673]" />
              </div>
              <h2 className="text-lg font-bold text-[#003366] leading-tight">
                Reading Fluency
                <br />
                Test Report
              </h2>
            </div>

            {/* Score */}
            <p className="text-[50px] font-bold text-[#1A6673] leading-18.75">
              {fluencyScore}
            </p>

            {/* Level */}
            <p
              className={`text-[26px] font-bold leading-9.75 ${fluencyStyle.text}`}
            >
              {fluencyLevel}
            </p>
            {/* View Report button */}
            <div className="mt-auto pt-4">
              <button
                onClick={() =>
                  router.push(
                    "/dashboard/oral-reading-test/reading-fluency-report",
                  )
                }
                className="w-45.5 h-11 bg-[#2E2E68] text-white text-[15px] font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
              >
                View Report
              </button>
            </div>
          </div>

          {/* ── Reading Comprehension Test Report Card ─────────── */}
          <div className="flex flex-col bg-[#FEFFFD] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-4xl p-8 gap-3">
            {/* Card header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12.25 h-12 bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-[10px]">
                <ClipboardCheck size={22} className="text-[#1A6673]" />
              </div>
              <h2 className="text-lg font-bold text-[#003366] leading-tight">
                Reading Comprehension
                <br />
                Test Report
              </h2>
            </div>

            {/* Score */}
            <p className="text-[50px] font-bold text-[#1A6673] leading-18.75">
              {comprehensionScore}
            </p>

            {/* Level */}
            <p
              className={`text-[26px] font-bold leading-9.75 ${comprehensionStyle.text}`}
            >
              {comprehensionLevel}
            </p>

            {/* View Report button */}
            <div className="mt-auto pt-4">
              <button
                onClick={() =>
                  router.push(
                    "/dashboard/oral-reading-test/comprehension/report",
                  )
                }
                className="w-45.5 h-11 bg-[#2E2E68] text-white text-[15px] font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
              >
                View Report
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-250 mx-auto mt-8">
          <div
            className={`flex items-center gap-6 ${overallStyle.bg} border ${overallStyle.border} shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-4xl px-10 py-8`}
          >
            {/* Icon box */}
            <div
              className={`flex h-12 w-12.25 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(74,74,252,0.06)] border ${overallStyle.border}`}
            >
              <FileText size={22} className={overallStyle.text} />
            </div>

            {/* Text content */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#003366] leading-tight">
                Reading Level
              </h3>
              <p
                className={`text-[30px] font-bold leading-11.25 ${overallStyle.text}`}
              >
                {overallLevel}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
