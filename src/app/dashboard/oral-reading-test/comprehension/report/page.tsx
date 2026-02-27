"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import ComprehensionReportHeader from "@/components/reports/oral-reading-test/comprehension-report/reportHeader"
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard"
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard"
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards"
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport"
import { getComprehensionReportAction } from "@/app/actions/comprehension-Test/getComprehensionReport"

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
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const assessmentId = sessionStorage.getItem("oral-reading-assessmentId")
        if (!assessmentId) {
          setError("Assessment not found. Please complete the test first.")
          setIsLoading(false)
          return
        }

        const result = await getComprehensionReportAction(assessmentId)
        if (!result.success || !("comprehensionTest" in result) || !result.comprehensionTest) {
          setError(("error" in result && result.error) || "Failed to load report data.")
          setIsLoading(false)
          return
        }

        const test = result.comprehensionTest
        const student = test.assessment.student
        const passage = test.assessment.passage

        // Compute tag breakdown from answers
        const tagBreakdown = { 
          literal: { correct: 0, total: 0 }, 
          inferential: { correct: 0, total: 0 }, 
          critical: { correct: 0, total: 0 } 
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

        setReportData({
          studentName: student.name,
          gradeLevel: `Grade ${student.level}`,
          className: student.class.name,
          passageTitle: passage.title,
          passageLevel: String(passage.level),
          testType: passage.testType,
          totalWords: passage.content.split(/\s+/).filter(Boolean).length,
          score: test.score,
          totalItems: test.totalItems,
          percentage,
          level: test.level,
          literal: tagBreakdown.literal,
          inferential: tagBreakdown.inferential,
          critical: tagBreakdown.critical,
        })
      } catch (err) {
        console.error("Failed to fetch comprehension report:", err)
        setError("Something went wrong while loading the report.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [])

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ComprehensionReportHeader />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-[1200px] mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
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

        {/* Bottom row: Passage Info + Comprehension Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Left column: Passage Info */}
          <PassageInfoCard
            passageTitle={reportData.passageTitle}
            passageLevel={reportData.passageLevel}
            numberOfWords={reportData.totalWords}
            testType={reportData.testType}
            assessmentType="Oral Reading Test"
          />

          {/* Right column: Comprehension Breakdown */}
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
