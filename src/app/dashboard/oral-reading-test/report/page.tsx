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
import type { OralFluencyAnalysis, MiscueResult, BehaviorResult } from "@/types/oral-reading"

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
  analysisResult?: OralFluencyAnalysis | null
  sessionId?: string
}

function loadSession(): Partial<SessionState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function countMiscuesByType(miscues: MiscueResult[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1
  }
  return counts
}

function buildMiscueData(analysis: OralFluencyAnalysis | null | undefined): MiscueData {
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
    }
  }

  const counts = countMiscuesByType(analysis.miscues)

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
  }
}

function buildBehaviorItems(analysis: OralFluencyAnalysis | null | undefined): BehaviorItem[] {
  const detectedTypes = new Set(
    (analysis?.behaviors || []).map((b: BehaviorResult) => b.behaviorType)
  )

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
  ]
}

export default function OralReadingReportPage() {
  const session = loadSession()
  const analysis = session.analysisResult

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

  // Use analysis WPM if available, otherwise compute from recorded time
  const wcpm = analysis?.wordsPerMinute
    ? Math.round(analysis.wordsPerMinute)
    : readingTimeSeconds > 0
      ? Math.round((totalWords / readingTimeSeconds) * 60)
      : 0

  const classification = analysis?.classificationLevel || "—"
  const miscueData = buildMiscueData(analysis)
  const behaviorItems = buildBehaviorItems(analysis)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ReportHeader />

      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth max-w-[1200px] mx-auto px-6 py-6 md:px-8 lg:px-12 space-y-6 w-full">
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
          <BehaviorChecklist behaviors={behaviorItems} />

          {/* Right column */}
          <MiscueAnalysisReport miscueData={miscueData} />
        </div>
      </main>
    </div>
  )
}
