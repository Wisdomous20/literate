"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, RotateCcw, Download } from "lucide-react";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards";
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport";
import { useAssessmentById } from "@/lib/hooks/useAssessmentById";
import { exportComprehensionReportPdf } from "@/lib/exportComprehensionReportPdf";

const SESSION_KEY = "reading-comprehension-session";

interface SessionState {
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load session:", err);
  }
  return {};
}

interface ReportData {
  studentName: string;
  gradeLevel: string;
  className: string;
  passageTitle: string;
  passageLevel: string;
  testType: string;
  totalWords: number;
  score: number;
  totalItems: number;
  percentage: number;
  level: string;
  literal: { correct: number; total: number };
  inferential: { correct: number; total: number };
  critical: { correct: number; total: number };
}

export default function ReadingComprehensionReportPage() {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const assessmentId = useMemo(() => {
    if (!isClient) return null;
    return sessionStorage.getItem("reading-comprehension-assessmentId");
  }, [isClient]);

  const { data: assessment, isLoading, error: fetchError } = useAssessmentById(assessmentId);

  const reportData = useMemo<ReportData | null>(() => {
    if (!assessment) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const test = (assessment as any)?.comprehension;
    if (!test) return null;

    const session = loadSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passage = (assessment as any)?.passage;

    const tagBreakdown = {
      literal: { correct: 0, total: 0 },
      inferential: { correct: 0, total: 0 },
      critical: { correct: 0, total: 0 },
    };

    for (const answer of test.answers) {
      const tag = answer.question.tags;
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

    const percentage =
      test.totalItems > 0
        ? Math.round((test.score / test.totalItems) * 100)
        : 0;

    return {
      studentName:
        session.studentName ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (assessment as any)?.student?.name ||
        "Unknown",
      gradeLevel: session.gradeLevel || "Unknown",
      className: session.selectedClassName || "Unknown",
      passageTitle: passage?.title || "Unknown",
      passageLevel: String(passage?.level ?? ""),
      testType: passage?.testType || "Unknown",
      totalWords:
        passage?.content?.split(/\s+/).filter(Boolean).length ?? 0,
      score: test.score,
      totalItems: test.totalItems,
      percentage,
      level: test.classificationLevel,
      literal: tagBreakdown.literal,
      inferential: tagBreakdown.inferential,
      critical: tagBreakdown.critical,
    };
  }, [assessment]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Reading Comprehension Test Report
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">
              Loading comprehension report...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const error = fetchError
    ? "Failed to load assessment data."
    : !assessmentId
      ? "Assessment not found. Please complete the test first."
      : !reportData
        ? "Comprehension test not found for this assessment."
        : null;

  if (error || !reportData) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
          <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
            Reading Comprehension Test Report
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-red-600 font-medium">
              {error || "No report data available."}
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

  const mistakes = reportData.totalItems - reportData.score;

  const handleExportPdf = () => {
    const safeName = reportData.studentName.replace(/[^a-zA-Z0-9]/g, "_");
    exportComprehensionReportPdf(
      {
        studentName: reportData.studentName,
        gradeLevel: reportData.gradeLevel,
        className: reportData.className,
        passageTitle: reportData.passageTitle,
        passageLevel: reportData.passageLevel,
        numberOfWords: reportData.totalWords,
        testType: reportData.testType,
        assessmentType: "Reading Comprehension Test",
        score: reportData.score,
        totalItems: reportData.totalItems,
        percentage: reportData.percentage,
        classificationLevel: reportData.level,
        literal: reportData.literal,
        inferential: reportData.inferential,
        critical: reportData.critical,
      },
      `Comprehension_Report_${safeName}`,
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Custom Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b-[3px] border-[#5D5DFB] bg-white">
        <h1 className="text-xl lg:text-2xl font-semibold text-[#31318A]">
          Reading Comprehension Test Report
        </h1>
      </div>

      {/* Nav row */}
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
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export to PDF
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem("reading-comprehension-session");
                sessionStorage.removeItem("reading-comprehension-assessmentId");
              } catch {}
              router.push("/dashboard/reading-comprehension-test");
            }}
            className="flex items-center gap-2 rounded-lg border border-[#6666FF]/30 bg-[rgba(102,102,255,0.06)] px-4 py-2 text-sm font-semibold text-[#6666FF] transition-all hover:bg-[rgba(102,102,255,0.12)]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Start New</span>
          </button>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-300 mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-4">
          <StudentInfoCard
            studentName={reportData.studentName}
            gradeLevel={reportData.gradeLevel}
            className={reportData.className}
          />
          <ComprehensionMetricCards
            percentageGrade={reportData.percentage}
            comprehensionLevel={reportData.level}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <PassageInfoCard
            passageTitle={reportData.passageTitle}
            passageLevel={reportData.passageLevel}
            numberOfWords={reportData.totalWords}
            testType={reportData.testType}
            assessmentType="Reading Comprehension Test"
          />
          <ComprehensionBreakdownReport
            score={`${reportData.score}/${reportData.totalItems}`}
            literal={`${reportData.literal.correct}/${reportData.literal.total}`}
            inferential={`${reportData.inferential.correct}/${reportData.inferential.total}`}
            critical={`${reportData.critical.correct}/${reportData.critical.total}`}
            mistakes={mistakes}
            numberOfItems={reportData.totalItems}
            classificationLevel={reportData.level}
          />
        </div>
      </main>
    </div>
  );
}