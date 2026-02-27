"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Timer, Minus, Plus, CheckCircle, XCircle, X } from "lucide-react"
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader"
import StudentInfoBar from "@/components/oral-reading-test/studentInfoBar"
import { PassageFilters } from "@/components/oral-reading-test/passageFilters"
import { PassageDisplay } from "@/components/oral-reading-test/passageDisplay"
import { ReadingTimer } from "@/components/oral-reading-test/readingTimer"
import { MiscueAnalysis } from "@/components/oral-reading-test/miscueAnalysis"
import { FullScreenPassage } from "@/components/oral-reading-test/fullScreenPassage"
import { AddPassageModal } from "@/components/oral-reading-test/addPassageModal"
import { getClassListBySchoolYear } from "@/app/actions/class/getClassList"
import { ReadinessCheckButton } from "@/components/oral-reading-test/readinessCheck"
import { createStudent } from "@/app/actions/student/createStudent"
import type { OralFluencyAnalysis } from "@/types/oral-reading"

// Helper to get current school year
function getCurrentSchoolYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

interface ClassItem {
  id: string
  name: string
}

const STORAGE_KEY = "oral-reading-session"
const AUDIO_STORAGE_KEY = "oral-reading-audio"

interface SessionState {
  studentName: string
  gradeLevel: string
  selectedStudentId: string
  selectedClassName: string
  passageContent: string
  selectedLanguage?: string
  selectedLevel?: string
  selectedTestType?: string
  selectedTitle?: string
  selectedPassage?: string
  countdownEnabled: boolean
  countdownSeconds: number
  hasRecording: boolean
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

function saveSession(state: SessionState) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(",")
  const mimeMatch = meta.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "audio/webm"
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export default function OralReadingTestPage() {
  const router = useRouter()
  const isRestoredRef = useRef(true)

  // Initialize with defaults (matches server render)
  const [passageContent, setPassageContent] = useState("")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [recordedSeconds, setRecordedSeconds] = useState(0)
  const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null)
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [countdownEnabled, setCountdownEnabled] = useState(true)
  const [countdownSeconds, setCountdownSeconds] = useState(3)
  const [isPassageModalOpen, setIsPassageModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>()
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>()
  const [selectedTestType, setSelectedTestType] = useState<string | undefined>()
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>()
  const [selectedPassage, setSelectedPassage] = useState<string | undefined>()
  const [studentName, setStudentName] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedClassName, setSelectedClassName] = useState<string>("")
  const [isHydrated, setIsHydrated] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [analysisResult, setAnalysisResult] = useState<OralFluencyAnalysis | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [highlightedTypes, setHighlightedTypes] = useState<Set<string>>(new Set())
  const [passageExpanded, setPassageExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleJumpToTime = useCallback((timestamp: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = timestamp
    audio.play().catch(() => {})
  }, [])

  const toggleHighlightType = useCallback((miscueType: string) => {
    setHighlightedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(miscueType)) {
        next.delete(miscueType)
      } else {
        next.add(miscueType)
      }
      return next
    })
  }, [])

  // Filter miscues for passage display based on highlighted types
  const filteredMiscues = useMemo(() => {
    if (!analysisResult?.miscues) return undefined
    if (highlightedTypes.size === 0) return analysisResult.miscues
    return analysisResult.miscues.filter((m) => highlightedTypes.has(m.miscueType))
  }, [analysisResult?.miscues, highlightedTypes])

  // Restore session from sessionStorage AFTER hydration (avoids SSR mismatch)
  useEffect(() => {
    const loaded = loadSession()

    if (loaded.studentName !== undefined) setStudentName(loaded.studentName)
    if (loaded.gradeLevel !== undefined) setGradeLevel(loaded.gradeLevel)
    if (loaded.selectedStudentId !== undefined) setSelectedStudentId(loaded.selectedStudentId)
    if (loaded.selectedClassName !== undefined) setSelectedClassName(loaded.selectedClassName)
    if (loaded.passageContent !== undefined) setPassageContent(loaded.passageContent)
    if (loaded.selectedLanguage !== undefined) setSelectedLanguage(loaded.selectedLanguage)
    if (loaded.selectedLevel !== undefined) setSelectedLevel(loaded.selectedLevel)
    if (loaded.selectedTestType !== undefined) setSelectedTestType(loaded.selectedTestType)
    if (loaded.selectedTitle !== undefined) setSelectedTitle(loaded.selectedTitle)
    if (loaded.selectedPassage !== undefined) setSelectedPassage(loaded.selectedPassage)
    if (loaded.countdownEnabled !== undefined) setCountdownEnabled(loaded.countdownEnabled)
    if (loaded.countdownSeconds !== undefined) setCountdownSeconds(loaded.countdownSeconds)
    if (loaded.hasRecording !== undefined) setHasRecording(loaded.hasRecording)
    if (loaded.recordedSeconds !== undefined) setRecordedSeconds(loaded.recordedSeconds)
    if (loaded.analysisResult) setAnalysisResult(loaded.analysisResult)
    if (loaded.sessionId) setSessionId(loaded.sessionId)

    // Restore audio blob
    try {
      const audioBase64 = sessionStorage.getItem(AUDIO_STORAGE_KEY)
      if (audioBase64 && loaded.hasRecording) {
        const blob = base64ToBlob(audioBase64)
        const url = URL.createObjectURL(blob)
        setRecordedAudioBlob(blob)
        setRecordedAudioURL(url)
      }
    } catch (err) {
      console.error("Failed to restore audio:", err)
    }

    // Mark hydration complete — this allows the save effects to start working
    setIsHydrated(true)

    // Mark restore as complete after a short delay (for auto-submit guard)
    const timer = setTimeout(() => {
      isRestoredRef.current = false
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Save audio to sessionStorage when it changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return
    if (recordedAudioBlob) {
      blobToBase64(recordedAudioBlob).then((base64) => {
        try {
          sessionStorage.setItem(AUDIO_STORAGE_KEY, base64)
        } catch (err) {
          console.error("Failed to save audio to sessionStorage:", err)
        }
      })
    } else {
      sessionStorage.removeItem(AUDIO_STORAGE_KEY)
    }
  }, [recordedAudioBlob, isHydrated])

  // Persist session state on every change (only after hydration)
  useEffect(() => {
    if (!isHydrated) return
    saveSession({
      studentName,
      gradeLevel,
      selectedStudentId,
      selectedClassName,
      passageContent,
      selectedLanguage,
      selectedLevel,
      selectedTestType,
      selectedTitle,
      selectedPassage,
      countdownEnabled,
      countdownSeconds,
      hasRecording,
      recordedSeconds,
      analysisResult,
      sessionId,
    })
  }, [
    isHydrated,
    studentName,
    gradeLevel,
    selectedStudentId,
    selectedClassName,
    passageContent,
    selectedLanguage,
    selectedLevel,
    selectedTestType,
    selectedTitle,
    selectedPassage,
    countdownEnabled,
    countdownSeconds,
    hasRecording,
    recordedSeconds,
    analysisResult,
    sessionId,
  ])

  // Fetch classes on mount
  useEffect(() => {
    async function fetchClasses() {
      setIsLoadingClasses(true)
      const schoolYear = getCurrentSchoolYear()
      const result = await getClassListBySchoolYear(schoolYear)

      if (result.success && result.classes) {
        const mappedClasses: ClassItem[] = result.classes.map(c => ({
          id: c.id,
          name: c.name,
        }))
        setClasses(mappedClasses)
      } else {
        setClasses([])
      }
      setIsLoadingClasses(false)
    }

    fetchClasses()
  }, [])

  const hasPassage = passageContent.length > 0

  const handleSelectPassage = useCallback((passage: {
    id: string
    title: string
    content: string
    language: string
    level: number
    tags: string
    testType: string
  }) => {
    setPassageContent(passage.content)
    setSelectedLanguage(passage.language)
    setSelectedLevel(`Grade ${passage.level}`)
    setSelectedTestType(passage.testType === "PRE_TEST" ? "Pre-Test" : "Post-Test")
    setSelectedTitle(passage.title)
    setSelectedPassage(passage.id)
    setHasRecording(false)
    setRecordedSeconds(0)
    setRecordedAudioBlob(null)
    setAnalysisResult(null)
    setSessionId("")
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

  const handleFullScreenDone = useCallback((elapsedSeconds: number, audioURL: string | null, audioBlob: Blob | null) => {
    isRestoredRef.current = false
    setRecordedSeconds(elapsedSeconds)
    setRecordedAudioURL(audioURL)
    setRecordedAudioBlob(audioBlob)
    setIsFullScreen(false)
    setHasRecording(true)
  }, [])

  const handleFullScreenClose = useCallback(() => {
    setIsFullScreen(false)
  }, [])

  const handleTryAgain = useCallback(() => {
    setHasRecording(false)
    setRecordedSeconds(0)
    setAnalysisResult(null)
    setSessionId("")
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
      setRecordedAudioURL(null)
    }
  }, [recordedAudioURL])

  const handleStartNew = useCallback(() => {
    // Revoke audio URL to free memory
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
    }
    // Reset all state to initial values
    setStudentName("")
    setGradeLevel("")
    setSelectedStudentId("")
    setSelectedClassName("")
    setPassageContent("")
    setSelectedLanguage(undefined)
    setSelectedLevel(undefined)
    setSelectedTestType(undefined)
    setSelectedTitle(undefined)
    setSelectedPassage(undefined)
    setHasRecording(false)
    setRecordedSeconds(0)
    setRecordedAudioURL(null)
    setRecordedAudioBlob(null)
    setCountdownEnabled(true)
    setCountdownSeconds(3)
    setAnalysisResult(null)
    setSessionId("")
    // Clear sessionStorage
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(AUDIO_STORAGE_KEY)
  }, [recordedAudioURL])

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSubmitRecording = useCallback(async () => {
    if (!recordedAudioBlob || !selectedPassage || !selectedStudentId) {
      console.log("Submit blocked - missing:", {
        hasBlob: !!recordedAudioBlob,
        selectedPassage,
        selectedStudentId,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { uploadAudioToSupabase } = await import("@/utils/uploadAudioToSupabase")
      const supabaseAudioUrl = await uploadAudioToSupabase(
        recordedAudioBlob,
        selectedStudentId,
        selectedPassage
      )

      if (!supabaseAudioUrl) {
        console.error("Audio upload failed")
        return
      }

      console.log("Audio uploaded to:", supabaseAudioUrl)

      const formData = new FormData()
      formData.append("studentId", selectedStudentId)
      formData.append("passageId", selectedPassage)
      formData.append("audioUrl", supabaseAudioUrl)
      formData.append("audio", recordedAudioBlob, "recording.webm")

      console.log("Sending to API:", `/api/oral-reading/${selectedPassage}`)

      const response = await fetch(`/api/oral-reading/${selectedPassage}`, {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("Raw API response:", response.status, responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        console.error("Analysis API non-JSON response:", response.status, responseText)
        return
      }

      if (!response.ok) {
        console.error("Analysis API error:", response.status, result)
        return
      }

      console.log("Session created:", result.sessionId)

      // Store analysis result for MiscueAnalysis and report
      if (result.analysis) {
        setAnalysisResult(result.analysis as OralFluencyAnalysis)
      }
      if (result.sessionId) {
        setSessionId(result.sessionId)
      }

      setToast({ message: "Reading Fluency Session Successful!", type: "success" })
    } catch (err) {
      console.error("Submit error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [recordedAudioBlob, selectedPassage, selectedStudentId])

  // Auto-submit only for FRESH recordings, not restored ones
  useEffect(() => {
    if (isRestoredRef.current) return
    if (hasRecording && recordedAudioBlob && selectedPassage && selectedStudentId) {
      console.log("Submitting recording...")
      handleSubmitRecording()
    }
  }, [hasRecording, recordedAudioBlob, selectedPassage, selectedStudentId, handleSubmitRecording])

  if (isFullScreen) {
    return (
      <FullScreenPassage
        content={passageContent}
        passageTitle={selectedTitle}
        onDone={handleFullScreenDone}
        onClose={handleFullScreenClose}
        countdownEnabled={countdownEnabled}
        countdownSeconds={countdownSeconds}
      />
    )
  }

  const classNames = classes.map(c => c.name)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DashboardHeader title="Oral Reading Test" />

      {/* Toast notification — fixed upper right */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className={`ml-1 rounded-full p-0.5 transition-colors ${
              toast.type === "success" ? "hover:bg-green-200" : "hover:bg-red-200"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className={`flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 lg:px-8 ${passageExpanded ? "gap-0 py-2" : "gap-3"}`}>
        {/* Nav row */}
        {!passageExpanded && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-semibold text-[#00306E] transition-colors hover:text-[#6666FF] md:text-base lg:text-lg"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span>Previous</span>
          </button>
          <h2 className="flex-1 text-center text-base font-bold md:text-lg lg:text-xl" style={{ color: "#0C1A6D" }}>
            Student Information
          </h2>
          <button
            onClick={() => hasRecording && router.push("/dashboard/oral-reading-test/comprehension")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 md:text-base ${
              hasRecording
                ? "bg-[#6666FF] text-white shadow-lg hover:bg-[#5555EE] animate-[pulseGlow_2s_ease-in-out_infinite]"
                : "text-[#00306E]/40 cursor-not-allowed"
            }`}
            disabled={!hasRecording}
            style={
              hasRecording
                ? { boxShadow: "0 0 20px rgba(102, 102, 255, 0.4), 0 4px 12px rgba(102, 102, 255, 0.3)" }
                : undefined
            }
          >
            <span>Continue to Comprehension</span>
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
        )}

        {/* Two-column layout: left content + right MiscueAnalysis */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Left column: student info, filters, passage, timer */}
          <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${passageExpanded ? "gap-0" : "gap-3"}`}>
            {!passageExpanded && !isLoadingClasses && (
              <StudentInfoBar
                studentName={studentName}
                gradeLevel={gradeLevel}
                classes={classNames}
                selectedClassName={selectedClassName}
                onStudentNameChange={setStudentName}
                onGradeLevelChange={setGradeLevel}
                onClassCreated={(newClass) => {
                  setClasses(prev => [...prev, { id: newClass, name: newClass }])
                }}
                onStudentSelected={(studentId: string) => setSelectedStudentId(studentId)}
                onClassChange={setSelectedClassName}
              />
            )}

            {!passageExpanded && (
              <PassageFilters
                language={hasPassage ? selectedLanguage : undefined}
                passageLevel={hasPassage ? selectedLevel : undefined}
                testType={hasPassage ? selectedTestType : undefined}
                hasPassage={hasPassage}
                onOpenPassageModal={() => setIsPassageModalOpen(true)}
              />
            )}

            <PassageDisplay
              content={passageContent}
              miscues={filteredMiscues}
              onJumpToTime={handleJumpToTime}
              expanded={passageExpanded}
              onToggleExpand={() => setPassageExpanded((prev) => !prev)}
            />

            {/* Word count under passage display */}
            {!passageExpanded && hasPassage && (
              <div className="mt-2 flex items-center">
                <span className="text-xs font-semibold text-[#00306E]">
                  {passageContent.split(/\s+/).length} words
                </span>
              </div>
            )}

            {/* Passage title above timer */}
            {!passageExpanded && hasPassage && (
              <div className="mb-2 flex items-center justify-center">
                <span className="text-lg font-bold text-[#31318A] md:text-xl">
                  {selectedTitle}
                </span>
              </div>
            )}

            {!passageExpanded && (
              <ReadingTimer
                hasPassage={hasPassage}
                onStartReading={handleStartReading}
                hasRecording={hasRecording}
                recordedSeconds={recordedSeconds}
                recordedAudioURL={recordedAudioURL}
                onTryAgain={handleTryAgain}
                onStartNew={handleStartNew}
                audioRef={audioRef}
              />
            )}

            {/* Countdown Toggle + Readiness Check Button */}
            {!passageExpanded && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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

              <ReadinessCheckButton />
            </div>
            )}
          </div>

          {/* Right column: MiscueAnalysis — responsive width */}
          <div className="w-[240px] shrink-0 self-stretch md:w-[270px] lg:w-[300px] xl:w-[320px]">
            <MiscueAnalysis
              disabled={!hasRecording}
              isAnalyzing={isSubmitting}
              miscues={analysisResult?.miscues}
              totalMiscue={analysisResult?.totalMiscues}
              oralFluencyScore={analysisResult?.oralFluencyScore}
              classificationLevel={analysisResult?.classificationLevel}
              highlightedTypes={highlightedTypes}
              onToggleHighlight={toggleHighlightType}
            />
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
