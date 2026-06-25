"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, RotateCcw, Download, FileBarChart2 } from "lucide-react";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards";
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
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
        <DashboardHeader
          title="Reading Comprehension Test Report"
          icon={<FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />}
        />
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
        <DashboardHeader
          title="Reading Comprehension Test Report"
          icon={<FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-red-600 font-medium">
              {error || "No report data available."}
            </p>
            <div className="relative">
              <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
              <button
                onClick={() => router.back()}
                className="relative flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 px-4 py-2 text-xs font-semibold shadow-sm transition-transform bg-white text-[#6666FF] hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                Back
              </button>
            </div>
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
      <DashboardHeader
        title="Reading Comprehension Test Report"
        icon={<FileBarChart2 className="h-4.5 w-4.5 text-[#6C4EEB] md:h-5 md:w-5" />}
      />

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-350 mx-auto h-full px-6 py-6 md:px-8 lg:px-12 w-full">
          <div className="flex h-full min-h-0 flex-col rounded-2xl border border-[#6666FF]/20 bg-white shadow-sm overflow-hidden">
            {/* Action bar */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E8FF] bg-[#F8F8FF] px-6 py-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="relative inline-flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 bg-white px-4 py-2 text-xs font-semibold text-[#6666FF] shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#F0F4FF] active:translate-y-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Back
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#6D28D9]"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] transition-colors hover:bg-[#F3E8FF]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start New
                </button>
              </div>
            </div>

            {/* Cards content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
