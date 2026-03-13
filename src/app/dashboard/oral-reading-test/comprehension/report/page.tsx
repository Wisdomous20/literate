"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import ComprehensionReportHeader from "@/components/reports/oral-reading-test/comprehension-report/reportHeader"
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard"
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard"
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards"
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport"
import { useAssessmentById } from "@/lib/hooks/useAssessmentById"
import { exportComprehensionReportPdf } from "@/lib/exportComprehensionReportPdf"

const STORAGE_KEY = "oral-reading-session"

interface SessionState {
  studentName: string
  gradeLevel: string
  selectedClassName: string
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error("Failed to load session:", err)
  }
  return {}
}

interface ReportData {
  studentName: string
  gradeLevel: string
  className: string
  passageTitle: string
  passageLevel: string
  testType: string
  totalWords: number
  score: number
  totalItems: number
  percentage: number
  level: string
  literal: { correct: number; total: number }
  inferential: { correct: number; total: number }
  critical: { correct: number; total: number }
}

export default function ComprehensionReportPage() {
  const router = useRouter()
  const isClient = typeof window !== "undefined"

  const assessmentId = useMemo(() => {
    if (!isClient) return null
    return sessionStorage.getItem("oral-reading-assessmentId")
  }, [isClient])

  const { data: assessment, isLoading, error: fetchError } = useAssessmentById(assessmentId)

  const reportData = useMemo<ReportData | null>(() => {
    if (!assessment) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const test = (assessment as any)?.comprehension
    if (!test) return null

    const session = loadSession()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passage = (assessment as any)?.passage

    const tagBreakdown = {
      literal: { correct: 0, total: 0 },
      inferential: { correct: 0, total: 0 },
      critical: { correct: 0, total: 0 },
    }

    for (const answer of test.answers) {
      const tag = answer.question.tags
      if (tag === "Literal") {
        tagBreakdown.literal.total++
        if (answer.isCorrect) tagBreakdown.literal.correct++
      } else if (tag === "Inferential") {
        tagBreakdown.inferential.total++
        if (answer.isCorrect) tagBreakdown.inferential.correct++
      } else if (tag === "Critical") {
        tagBreakdown.critical.total++
        if (answer.isCorrect) tagBreakdown.critical.correct++
      }
    }

    const percentage = test.totalItems > 0 ? Math.round((test.score / test.totalItems) * 100) : 0

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studentName: session.studentName || (assessment as any)?.student?.name || "Unknown",
      gradeLevel: session.gradeLevel || "Unknown",
      className: session.selectedClassName || "Unknown",
      passageTitle: passage?.title || "Unknown",
      passageLevel: String(passage?.level ?? ""),
      testType: passage?.testType || "Unknown",
      totalWords: passage?.content?.split(/\s+/).filter(Boolean).length ?? 0,
      score: test.score,
      totalItems: test.totalItems,
      percentage,
      level: test.classificationLevel,
      literal: tagBreakdown.literal,
      inferential: tagBreakdown.inferential,
      critical: tagBreakdown.critical,
    }
  }, [assessment])

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <ComprehensionReportHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">Loading comprehension report...</span>
          </div>
        </div>
      </div>
    )
  }

  const error = fetchError
    ? "Failed to load assessment data."
    : !assessmentId
      ? "Assessment not found. Please complete the test first."
      : !reportData
        ? "Comprehension test not found for this assessment."
        : null

  if (error || !reportData) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <ComprehensionReportHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-red-600 font-medium">{error || "No report data available."}</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-[#6666FF] px-6 py-2 text-sm font-semibold text-white hover:bg-[#5555EE] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mistakes = reportData.totalItems - reportData.score

  const handleExportPdf = () => {
    const safeName = reportData.studentName.replace(/[^a-zA-Z0-9]/g, "_")
    exportComprehensionReportPdf(
      {
        studentName: reportData.studentName,
        gradeLevel: reportData.gradeLevel,
        className: reportData.className,
        passageTitle: reportData.passageTitle,
        passageLevel: reportData.passageLevel,
        numberOfWords: reportData.totalWords,
        testType: reportData.testType,
        assessmentType: "Oral Reading Test",
        score: reportData.score,
        totalItems: reportData.totalItems,
        percentage: reportData.percentage,
        classificationLevel: reportData.level,
        literal: reportData.literal,
        inferential: reportData.inferential,
        critical: reportData.critical,
      },
      `Comprehension_Report_${safeName}`,
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ComprehensionReportHeader onExportPdf={handleExportPdf} />

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
            assessmentType="Oral Reading Test"
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
  )
}