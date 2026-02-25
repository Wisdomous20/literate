"use client"

import ComprehensionReportHeader from "@/components/reports/oral-reading-test/comprehension-report/reportHeader"
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard"
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard"
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards"
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport"

const STORAGE_KEY = "oral-reading-session"

interface SessionState {
  studentName: string
  gradeLevel: string
  selectedClassName: string
  passageContent: string
  selectedLanguage?: string
  selectedLevel?: string
  selectedTestType?: string
  selectedTitle?: string
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* empty */
  }
  return {}
}

// Mock comprehension data — replace with real API results later
const mockComprehensionData = {
  score: "8/10",
  percentageGrade: 80,
  comprehensionLevel: "Independent",
  literal: 60,
  inferential: 60,
  critical: 60,
  mistakes: 60,
  numberOfItems: 200,
  classificationLevel: "Independent",
}

export default function ComprehensionReportPage() {
  const session = loadSession()

  const studentName = session.studentName || "—"
  const gradeLevel = session.gradeLevel ? `Grade ${session.gradeLevel}` : "—"
  const studentClass = session.selectedClassName || "—"
  const passageTitle = session.selectedTitle || "—"
  const passageLevel = session.selectedLevel || "—"
  const testType = session.selectedTestType || "—"
  const totalWords = session.passageContent
    ? session.passageContent.split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ComprehensionReportHeader />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-[1200px] mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard
            studentName={studentName}
            gradeLevel={gradeLevel}
            className={studentClass}
          />
          <ComprehensionMetricCards
            percentageGrade={mockComprehensionData.percentageGrade}
            comprehensionLevel={mockComprehensionData.comprehensionLevel}
          />
        </div>

        {/* Bottom row: Passage Info + Comprehension Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left column: Passage Info */}
          <PassageInfoCard
            passageTitle={passageTitle}
            passageLevel={passageLevel}
            numberOfWords={totalWords}
            testType={testType}
            assessmentType="Oral Reading Test"
          />

          {/* Right column: Comprehension Breakdown */}
          <ComprehensionBreakdownReport
            score={mockComprehensionData.score}
            literal={mockComprehensionData.literal}
            inferential={mockComprehensionData.inferential}
            critical={mockComprehensionData.critical}
            mistakes={mockComprehensionData.mistakes}
            numberOfItems={mockComprehensionData.numberOfItems}
            classificationLevel={mockComprehensionData.classificationLevel}
          />
        </div>
      </main>
    </div>
  )
}
