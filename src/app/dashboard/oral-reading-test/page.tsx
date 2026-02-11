"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Timer, Minus, Plus } from "lucide-react"
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
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore session from sessionStorage AFTER hydration
  useEffect(() => {
    try {
      const audioBase64 = sessionStorage.getItem(AUDIO_STORAGE_KEY)
      const loaded = loadSession()
      if (audioBase64 && loaded.hasRecording) {
        const blob = base64ToBlob(audioBase64)
        const url = URL.createObjectURL(blob)
        setRecordedAudioBlob(blob)
        setRecordedAudioURL(url)
      }
    } catch (err) {
      console.error("Failed to restore audio:", err)
    }

    // Mark restore as complete
    const timer = setTimeout(() => {
      isRestoredRef.current = false
    }, 500)

    setIsHydrated(true)
    return () => clearTimeout(timer)
  }, [])

  // Save audio to sessionStorage when it changes
  useEffect(() => {
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
  }, [recordedAudioBlob])

  // Persist session state on every change
  useEffect(() => {
    saveSession({
      studentName,
      gradeLevel,
      selectedStudentId,
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
    })
  }, [
    studentName,
    gradeLevel,
    selectedStudentId,
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
    isRestoredRef.current = false // ensure auto-submit fires for fresh recordings
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
    if (recordedAudioURL) {
      URL.revokeObjectURL(recordedAudioURL)
      setRecordedAudioURL(null)
    }
  }, [recordedAudioURL])

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
      // 1. Upload audio to Supabase Storage
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

      // 2. Send audio blob + metadata to analysis API route
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

      const result = await response.json()

      if (!response.ok) {
        console.error("Analysis API error:", result)
        return
      }

      console.log("Session created:", result.sessionId)
    } catch (err) {
      console.error("Submit error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [recordedAudioBlob, selectedPassage, selectedStudentId])


  // Auto-submit only for FRESH recordings, not restored ones
  useEffect(() => {
    console.log("useEffect check:", {
      hasRecording,
      hasBlob: !!recordedAudioBlob,
      selectedPassage,
      selectedStudentId,
      isRestored: isRestoredRef.current,
    })
    if (isRestoredRef.current) return // skip auto-submit on restore
    if (hasRecording && recordedAudioBlob && selectedPassage && selectedStudentId) {
      console.log("Submitting recording...")
      handleSubmitRecording()
    }
  }, [hasRecording, recordedAudioBlob, selectedPassage, selectedStudentId, handleSubmitRecording])


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


  const classNames = classes.map(c => c.name)

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
            {!isLoadingClasses && (
              <StudentInfoBar
                studentName={studentName}
                gradeLevel={gradeLevel}
                classes={classNames}
                onStudentNameChange={setStudentName}
                onGradeLevelChange={setGradeLevel}
                onClassCreated={(newClass) => {
                  setClasses(prev => [...prev, { id: newClass, name: newClass }])
                }}
                onStudentSelected={(studentId: string) => setSelectedStudentId(studentId)}
              />
            )}

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

            {/* Countdown Toggle + Readiness Check Button */}
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
