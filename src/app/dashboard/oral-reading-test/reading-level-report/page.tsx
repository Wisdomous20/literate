"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ChevronDown,
  FileText,
  ClipboardCheck,
} from "lucide-react"

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
  } catch {
    /* empty */
  }
  return {}
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
        text: "text-[#D4890B]",
        bg: "bg-[#FFF3D6]",
        border: "border-[#D4890B]",
        raw: "#D4890B",
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

// Mock data — replace with real API / session data later
const mockFluencyData = {
  score: "80%",
  level: "Independent",
}

const mockComprehensionData = {
  score: "80%",
  level: "Independent",
}

const mockOverallLevel = "Independent"

export default function ReadingLevelReportPage() {
  const router = useRouter()
  // Session data will be used when replacing mock data with real API results
  const _session = loadSession()
  void _session

  const fluencyScore = mockFluencyData.score
  const fluencyLevel = mockFluencyData.level
  const comprehensionScore = mockComprehensionData.score
  const comprehensionLevel = mockComprehensionData.level
  const overallLevel = mockOverallLevel

  const overallStyle = getLevelStyle(overallLevel)
  const [isExpanded, setIsExpanded] = useState(true)

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

      {/* ── Sub-header: Accordion toggle + Actions ────────────────── */}
      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-[#31318A] font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          <ChevronDown
            size={24}
            className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
          />
          Reading Level Report
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/oral-reading-test")}
            className="px-5 py-2 bg-[#2E2E68] text-white text-xs font-medium rounded-[10px] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#2E2E68]/90 transition-colors"
          >
            Re-Attempt
          </button>
          <button
            type="button"
            className="px-5 py-2 bg-[#297CEC] text-white text-xs font-medium rounded-[10px] border border-[#54A4FF] shadow-[0_1px_20px_rgba(108,164,239,0.37)] hover:bg-[#297CEC]/90 transition-colors"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {/* ── Main Content (accordion body) ─────────────────────── */}
      {isExpanded && (
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
            <p className="text-[26px] font-bold text-[#2E2E68] leading-[39px]">
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
            <p className="text-[26px] font-bold text-[#2E2E68] leading-[39px]">
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
              <p
                className="text-[20px] font-normal text-[#162DB0]"
                style={{ fontFamily: "Kanit, sans-serif" }}
              >
                Oral Reading Level
              </p>
            </div>
          </div>
        </div>
      </main>
      )}
    </div>
  )
}
