"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Timer, Minus, Plus } from "lucide-react"
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader"
import { StudentInfoBar } from "@/components/oral-reading-test/studentInfoBar"
import { PassageFilters } from "@/components/oral-reading-test/passageFilters"
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay"
import { ReadingTimer } from "@/components/oral-reading-test/readingTimer"
import { MiscueAnalysis } from "@/components/oral-reading-test/miscueAnalysis"
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage"
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal"

const mockStudent = {
  name: "Lois",
  gradeLevel: "Grade 4",
  classes: ["Narra Class", "Narra Class"],
  schoolYear: "2026",
}

const samplePassage = `The Department of Education recognizes the significance of reading comprehension and the country's competence to international literacy standards through the implementation of reading assessments such as the Philippine Informal Reading Inventory (Phil-IRI) which is a classroom-based reading comprehension assessment tool used by public elementary and secondary teachers to determine the reading level of the student. It also serves as a reading assessment tool that helps teachers identify the reading level of students and provide appropriate interventions to improve their reading skills.`

export default function OralReadingTestPage() {
  const router = useRouter()
  const [passageContent, setPassageContent] = useState("")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [recordedSeconds, setRecordedSeconds] = useState(0)
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [countdownEnabled, setCountdownEnabled] = useState(true)
  const [countdownSeconds, setCountdownSeconds] = useState(3)
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>()
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>()
  const [selectedTestType, setSelectedTestType] = useState<string | undefined>()
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>()
  const [selectedPassage, setSelectedPassage] = useState<string | undefined>(undefined)

  const hasPassage = passageContent.length > 0

  const handleSelectPassage = useCallback((passage: { title: string; language: string; level: string; testType: string }) => {
    setPassageContent(samplePassage)
    setSelectedLanguage(passage.language)
    setSelectedLevel(passage.level)
    setSelectedTestType(passage.testType)
    setSelectedTitle(passage.title)
    // Reset any existing recording when passage changes
    setHasRecording(false)
    setRecordedSeconds(0)
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
      setRecordedAudioURL(null)
    }
  }, [recordedAudioURL])

  const handleStartReading = useCallback(() => {
    if (!hasPassage) return
    setIsFullScreen(true)
    setHasRecording(false)
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
      setRecordedAudioURL(null)
    }
  }, [hasPassage, recordedAudioURL])

  const handleFullScreenDone = useCallback((elapsedSeconds: number, audioURL: string | null) => {
    setRecordedSeconds(elapsedSeconds)
    setRecordedAudioURL(audioURL)
    setIsFullScreen(false)
    setHasRecording(true)
  }, [])

  const handleFullScreenClose = useCallback(() => {
    setIsFullScreen(false)
  }, [])

  const handleTryAgain = useCallback(() => {
    setHasRecording(false)
    setRecordedSeconds(0)
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
      setRecordedAudioURL(null)
    }
  }, [recordedAudioURL])

  if (isFullScreen) {
    return (
      <FullScreenPassage
        content={passageContent}
        onDone={handleFullScreenDone}
        onClose={handleFullScreenClose}
        countdownEnabled={countdownEnabled}
        countdownSeconds={countdownSeconds}
      />
    )
  }

  function formatTime(seconds: number): React.ReactNode {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Oral Reading Test" />

      <main className="flex min-h-0 flex-1 flex-col gap-3 px-8 py-4">
        {/* Nav row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-lg font-semibold text-[#00306E] transition-colors hover:text-[#6666FF]"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>
          <h2 className="flex-1 text-center text-xl font-bold" style={{ color: "#0C1A6D" }}>
            Student Information
          </h2>
          <button className="flex items-center gap-1 text-lg font-semibold text-[#00306E] transition-colors hover:text-[#6666FF]">
            <span>Proceed to Comprehension</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Two-column layout: left content + right MiscueAnalysis */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Left column: student info, filters, passage, timer */}
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <StudentInfoBar
              studentName={mockStudent.name}
              gradeLevel={mockStudent.gradeLevel}
              classes={mockStudent.classes}
            />

            <PassageFilters
              language={hasPassage ? selectedLanguage : undefined}
              passageLevel={hasPassage ? selectedLevel : undefined}
              testType={hasPassage ? selectedTestType : undefined}
              hasPassage={hasPassage}
              onOpenPassageModal={() => setIsPassageModalOpen(true)}
            />

            <div className="min-h-0 flex-1">
              <PassageDisplay content={passageContent} />
            </div>

            {/* Word count under passage display */}
            {hasPassage && (
              <div className="mt-2 flex items-center">
                <span className="text-xs font-semibold text-[#00306E]">
                  {passageContent.split(/\s+/).length} words
                </span>
              </div>
            )}

            {/* Passage title above timer */}
            {hasPassage && (
              <div className="mb-2 flex items-center justify-center">
                <span className="text-base font-bold text-[#31318A]">
                  {selectedTitle}
                </span>
              </div>
            )}

            <ReadingTimer
              hasPassage={hasPassage}
              onStartReading={handleStartReading}
              hasRecording={hasRecording}
              recordedSeconds={recordedSeconds}
              recordedAudioURL={recordedAudioURL}
              onTryAgain={handleTryAgain}
            />

            {/* Countdown Toggle */}
            <div className="flex items-center gap-2 self-start">
              <Timer className="h-4 w-4" style={{ color: "#6666FF" }} />
              <span className="text-xs font-medium" style={{ color: "#31318A" }}>
                Countdown
              </span>
              <button
                onClick={() => setCountdownEnabled(!countdownEnabled)}
                className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{ background: countdownEnabled ? "#6666FF" : "#C4C4FF" }}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: countdownEnabled ? "translateX(17px)" : "translateX(3px)",
                  }}
                />
              </button>
              {countdownEnabled && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCountdownSeconds(Math.max(1, countdownSeconds - 1))}
                    className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:opacity-70"
                    style={{ background: "rgba(102, 102, 255, 0.15)" }}
                  >
                    <Minus className="h-3 w-3" style={{ color: "#6666FF" }} />
                  </button>
                  <span
                    className="w-5 text-center text-xs font-bold tabular-nums"
                    style={{ color: "#6666FF" }}
                  >
                    {countdownSeconds}
                  </span>
                  <button
                    onClick={() => setCountdownSeconds(Math.min(10, countdownSeconds + 1))}
                    className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:opacity-70"
                    style={{ background: "rgba(102, 102, 255, 0.15)" }}
                  >
                    <Plus className="h-3 w-3" style={{ color: "#6666FF" }} />
                  </button>
                  <span className="text-[10px] font-medium" style={{ color: "#31318A" }}>sec</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column: MiscueAnalysis — full height */}
          <div className="w-[280px] shrink-0 self-stretch">
            <MiscueAnalysis />
          </div>
        </div>
      </main>

      {/* Add Passage Modal */}
      <AddPassageModal
        isOpen={isPassageModalOpen}
        onClose={() => setIsPassageModalOpen(false)}
        onSelectPassage={handleSelectPassage}
      />
    </div>
  )
}
