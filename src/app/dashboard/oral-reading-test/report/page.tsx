"use client"

import ReportHeader from "@/components/reports/oral-reading-test/reading-fluency-report/reportHeader"
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard"
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard"
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards"
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis"
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard"
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist"
import type { MiscueData } from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis"
import type { BehaviorItem } from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist"

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
  recordedSeconds: number
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

// Placeholder mock data — will be replaced with actual analysis results
const mockMiscueData: MiscueData = {
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
}

const mockBehaviors: BehaviorItem[] = [
  {
    label: "Does word-by-word reading",
    description: "(Nagbabasa nang pa-isa isang salita)",
  },
  {
    label: "Lacks expression: reads in a monotonous tone",
    description: "(Walang damdamin; walang pagbabago ang tono)",
  },
  {
    label: "Disregards Punctuation",
    description: "(Hindi pinapansin ang mga bantas)",
  },
  {
    label: "Employs little or no method of analysis",
    description: "(Bahagya o walang paraan ng pagsusuri)",
  },
]

export default function OralReadingReportPage() {
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
  const readingTimeSeconds = session.recordedSeconds || 0
  const readingTimeMinutes = readingTimeSeconds > 0
    ? (Math.round((readingTimeSeconds / 60) * 10) / 10).toString()
    : "0"

  const wcpm = readingTimeSeconds > 0
    ? Math.round((totalWords / readingTimeSeconds) * 60)
    : 0
  const classification = "—"

  return (
    <div className="flex h-full flex-col">
      <ReportHeader />

      <main className="flex-1 overflow-y-auto max-w-[1200px] mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
        {/* Top row: Student Info + Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <StudentInfoCard
            studentName={studentName}
            gradeLevel={gradeLevel}
            className={studentClass}
          />
          <MetricCards
            wcpm={wcpm}
            readingTime={readingTimeMinutes}
            classificationLevel={classification}
          />
        </div>

        {/* Bottom row: Passage+Audio | Behavior | Miscue */}
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
            <AudioPlaybackCard />
          </div>

          {/* Center column */}
          <BehaviorChecklist behaviors={mockBehaviors} />

          {/* Right column */}
          <MiscueAnalysisReport miscueData={mockMiscueData} />
        </div>
      </main>
    </div>
  )
}
