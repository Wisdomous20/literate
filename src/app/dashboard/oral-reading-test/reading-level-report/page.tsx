"use client"

import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ChevronLeft,
  FileText,
  ClipboardCheck,
} from "lucide-react"
import type { OralFluencyAnalysis } from "@/types/oral-reading"

const STORAGE_KEY = "oral-reading-session"

interface ComprehensionResult {
  score: number
  totalItems: number
  percentage: number
  level: string
}

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
  comprehensionResult?: ComprehensionResult | null
  oralReadingLevel?: string | null
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

/** Format a LevelClassification enum value for display (e.g. "INDEPENDENT" → "Independent") */
function formatLevel(level: string | undefined | null): string {
  if (!level) return "—"
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
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
      }
    case "instructional":
      return {
        text: "text-[#297CEC]",
        bg: "bg-[#EAF3FF]",
        border: "border-[#297CEC]",
        raw: "#297CEC",
      }
    case "frustration":
      return {
        text: "text-[#CE330C]",
        bg: "bg-[#F6D1D2]",
        border: "border-[#CE330C]",
        raw: "#CE330C",
      }
    default:
      return {
        text: "text-[#2E2E68]",
        bg: "bg-[#E8E8FF]",
        border: "border-[#54A4FF]",
        raw: "#2E2E68",
      }
  }
}

export default function ReadingLevelReportPage() {
  const router = useRouter()
  const session = loadSession()

  // Fluency data from analysisResult (stored by oral-reading-test page after fluency API call)
  const analysisResult = session.analysisResult
  const fluencyScore = analysisResult?.oralFluencyScore != null
    ? `${analysisResult.oralFluencyScore}%`
    : "—"
  const fluencyLevel = formatLevel(analysisResult?.classificationLevel)

  // Comprehension data (stored by comprehension page after POST /api/oral-reading/comprehension)
  const comprehensionResult = session.comprehensionResult
  const comprehensionScore = comprehensionResult?.totalItems
    ? `${Math.round((comprehensionResult.score / comprehensionResult.totalItems) * 100)}%`
    : "—"
  const comprehensionLevel = formatLevel(comprehensionResult?.level)

  // Overall oral reading level — computed by backend createOralReadingService,
  // returned in the comprehension API response and stored in session
  const overallLevel = formatLevel(session.oralReadingLevel)

  const fluencyStyle = getLevelStyle(fluencyLevel)
  const comprehensionStyle = getLevelStyle(comprehensionLevel)
  const overallStyle = getLevelStyle(overallLevel)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#E4F4FF]">
      {/* ── Header Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#8D8DEC] shadow-[0_4px_4px_#54A4FF]">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={24} className="text-[#00306E]" />
          <h1 className="text-xl lg:text-[25px] font-semibold text-[#00306E] font-[family-name:var(--font-poppins)]">
            Oral Reading Test Report
          </h1>
        </div>

      </div>

      {/* ── Sub-header: Previous button + Actions ────────────────── */}
      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#5555EE] md:text-base"
          style={{ boxShadow: "0 0 20px rgba(102, 102, 255, 0.4), 0 4px 12px rgba(102, 102, 255, 0.3)" }}
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/oral-reading-test")}
            className="px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-[10px] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#2E2E68]/90 transition-colors"
          >
            Start New
          </button>
          <button
            type="button"
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-[10px] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-8 py-6 md:px-12 lg:px-16 animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Report Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {/* ── Oral Fluency Test Report Card ──────────────────── */}
          <div className="flex flex-col bg-[#FEFFFD] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-[20px] p-8 gap-3">
            {/* Card header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-[49px] h-[48px] bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-[10px]">
                <FileText size={22} className="text-[#1A6673]" />
              </div>
              <h2 className="text-lg font-bold text-[#003366] leading-tight">
                Oral Fluency<br />Test Report
              </h2>
            </div>

            {/* Score */}
            <p className="text-[50px] font-bold text-[#1A6673] leading-[75px]">
              {fluencyScore}
            </p>

            {/* Level */}
            <p className="text-[26px] font-bold leading-[39px]" style={{ color: fluencyStyle.raw }}>
              {fluencyLevel}
            </p>

            {/* View Report button */}
            <div className="mt-auto pt-4">
              <button
                onClick={() =>
                  router.push("/dashboard/oral-reading-test/reading-fluency-report")
                }
                className="w-[182px] h-[44px] bg-[#2E2E68] text-white text-[15px] font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
              >
                View Report
              </button>
            </div>
          </div>

          {/* ── Reading Comprehension Test Report Card ─────────── */}
          <div className="flex flex-col bg-[#FEFFFD] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-[20px] p-8 gap-3">
            {/* Card header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-[49px] h-[48px] bg-[rgba(74,74,252,0.06)] border border-[#DAE6FF] rounded-[10px]">
                <ClipboardCheck size={22} className="text-[#1A6673]" />
              </div>
              <h2 className="text-lg font-bold text-[#003366] leading-tight">
                Reading Comprehension<br />Test Report
              </h2>
            </div>

            {/* Score */}
            <p className="text-[50px] font-bold text-[#1A6673] leading-[75px]">
              {comprehensionScore}
            </p>

            {/* Level */}
            <p className="text-[26px] font-bold leading-[39px]" style={{ color: comprehensionStyle.raw }}>
              {comprehensionLevel}
            </p>

            {/* View Report button */}
            <div className="mt-auto pt-4">
              <button
                onClick={() =>
                  router.push(
                    "/dashboard/oral-reading-test/comprehension/report"
                  )
                }
                className="w-[182px] h-[44px] bg-[#2E2E68] text-white text-[15px] font-medium rounded-lg border border-[#5D5DFB] shadow-[0_1px_20px_rgba(65,155,180,0.47)] hover:bg-[#2E2E68]/90 transition-colors"
              >
                View Report
              </button>
            </div>
          </div>
        </div>

        {/* ── Overall Oral Reading Level Card ──────────────────── */}
        <div className="max-w-[1000px] mx-auto mt-8">
          <div
            className={`flex items-center gap-6 ${overallStyle.bg} border ${overallStyle.border} shadow-[0_1px_20px_rgba(108,164,239,0.37)] rounded-[20px] px-10 py-8`}
          >
            {/* Icon box */}
            <div
              className="flex items-center justify-center w-[49px] h-[48px] bg-[rgba(74,74,252,0.06)] rounded-[10px] shrink-0"
              style={{ border: `1px solid ${overallStyle.raw}` }}
            >
              <FileText size={22} style={{ color: overallStyle.raw }} />
            </div>

            {/* Text content */}
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#003366] leading-tight">
                Oral Reading Level
              </h3>
              <p
                className="text-[30px] font-bold leading-[45px]"
                style={{ color: overallStyle.raw }}
              >
                {overallLevel}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
