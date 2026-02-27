"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, Clock, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader"
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown"
import { getQuizByPassageAction } from "@/app/actions/comprehension-Test/getQuizByPassage"
import { getAssessmentByIdAction } from "@/app/actions/assessment/getAssessmentById"

const OPTION_LABELS = ["A", "B", "C", "D"]
const COMP_STORAGE_KEY = "oral-reading-comprehension-state"

interface QuestionData {
  id: string
  questionNumber: number
  questionText: string
  type: "MULTIPLE_CHOICE" | "ESSAY"
  tags?: string
  options?: string[]
}

interface TagBreakdown {
  literal: { correct: number; total: number }
  inferential: { correct: number; total: number }
  critical: { correct: number; total: number }
}

interface ComprehensionResult {
  score: number
  totalItems: number
  level: string
  comprehensionTestId: string
  tagBreakdown?: TagBreakdown
}

interface ComprehensionState {
  assessmentId: string
  answers: Record<string, string>
  elapsedSeconds: number
  isSubmitted: boolean
  comprehensionResult: ComprehensionResult | null
}

function loadComprehensionState(): ComprehensionState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(COMP_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return null
}

function saveComprehensionState(state: ComprehensionState) {
  try {
    sessionStorage.setItem(COMP_STORAGE_KEY, JSON.stringify(state))
  } catch { /* empty */ }
}

function computeTagBreakdown(
  answers: { isCorrect: boolean | null; question: { tags: string } }[]
): TagBreakdown {
  const breakdown: TagBreakdown = {
    literal: { correct: 0, total: 0 },
    inferential: { correct: 0, total: 0 },
    critical: { correct: 0, total: 0 },
  }
  for (const a of answers) {
    const tag = a.question.tags
    if (tag === "Literal") {
      breakdown.literal.total++
      if (a.isCorrect) breakdown.literal.correct++
    } else if (tag === "Inferential") {
      breakdown.inferential.total++
      if (a.isCorrect) breakdown.inferential.correct++
    } else if (tag === "Critical") {
      breakdown.critical.total++
      if (a.isCorrect) breakdown.critical.correct++
    }
  }
  return breakdown
}

export default function OralReadingComprehensionPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [comprehensionResult, setComprehensionResult] = useState<ComprehensionResult | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch questions on mount + restore saved state
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const currentAssessmentId = sessionStorage.getItem("oral-reading-assessmentId")

        // Restore saved comprehension progress only if it belongs to the current assessment
        const saved = loadComprehensionState()
        if (saved && saved.assessmentId === currentAssessmentId) {
          setAnswers(saved.answers)
          setElapsedSeconds(saved.elapsedSeconds)
          if (saved.isSubmitted && saved.comprehensionResult) {
            setIsSubmitted(true)
            setComprehensionResult(saved.comprehensionResult)
          }
        } else if (saved && saved.assessmentId !== currentAssessmentId) {
          // Stale state from a different assessment — clear it
          sessionStorage.removeItem(COMP_STORAGE_KEY)
        }

        // If not already submitted from saved state, check DB for existing submission
        const isRestoredSubmitted = saved?.assessmentId === currentAssessmentId && saved?.isSubmitted
        if (!isRestoredSubmitted) {
          const assessmentId = currentAssessmentId
          if (assessmentId) {
            try {
              const assessment = await getAssessmentByIdAction(assessmentId)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const existing = (assessment as any)?.comprehension
              if (existing) {
                const tagBreakdown = computeTagBreakdown(existing.answers)
                const restoredResult = {
                  score: existing.score,
                  totalItems: existing.totalItems,
                  level: existing.level,
                  comprehensionTestId: existing.id,
                  tagBreakdown,
                }
                setComprehensionResult(restoredResult)
                setIsSubmitted(true)
                // Restore answers from DB
                const restoredAnswers: Record<string, string> = {}
                for (const a of existing.answers) {
                  restoredAnswers[a.questionId] = a.answer
                }
                setAnswers(restoredAnswers)
                if (existing.id) {
                  sessionStorage.setItem("oral-reading-comprehensionTestId", existing.id)
                }
                saveComprehensionState({
                  assessmentId: assessmentId,
                  answers: restoredAnswers,
                  elapsedSeconds: saved?.elapsedSeconds ?? 0,
                  isSubmitted: true,
                  comprehensionResult: restoredResult,
                })
              }
            } catch {
              // Assessment not found or error — continue to load questions
            }
          }
        }

        const raw = sessionStorage.getItem("oral-reading-session")
        if (!raw) {
          setLoadError("Session not found. Please go back and start again.")
          setIsLoading(false)
          return
        }
        const session = JSON.parse(raw)
        const passageId = session.selectedPassage
        if (!passageId) {
          setLoadError("No passage selected. Please go back and select a passage.")
          setIsLoading(false)
          return
        }

        const result = await getQuizByPassageAction(passageId)
        if (!result.success || !("quiz" in result) || !result.quiz) {
          setLoadError(("error" in result && result.error) || "Failed to load quiz questions.")
          setIsLoading(false)
          return
        }

        const { quiz } = result

        const mapped: QuestionData[] = quiz.questions.map(
          (q: { id: string; questionText: string; tags: string | null; type: string; options: unknown }, idx: number) => ({
            id: q.id,
            questionNumber: idx + 1,
            questionText: q.questionText,
            type: q.type as "MULTIPLE_CHOICE" | "ESSAY",
            tags: q.tags ?? undefined,
            options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
          })
        )

        setQuestions(mapped)
      } catch (err) {
        console.error("Failed to fetch questions:", err)
        setLoadError("Something went wrong while loading questions.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // Timer — stops when submitted or paused
  useEffect(() => {
    if (isSubmitted || isPaused) return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isSubmitted, isPaused])

  // Persist comprehension state to sessionStorage on every change
  useEffect(() => {
    if (isLoading) return
    const currentAssessmentId = sessionStorage.getItem("oral-reading-assessmentId") || ""
    saveComprehensionState({
      assessmentId: currentAssessmentId,
      answers,
      elapsedSeconds,
      isSubmitted,
      comprehensionResult,
    })
  }, [answers, elapsedSeconds, isSubmitted, comprehensionResult, isLoading])

  const togglePause = () => {
    if (!isSubmitted) setIsPaused((prev) => !prev)
  }

  // Track scroll position to show/hide scroll-down button
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener("scroll", handleScroll)
    handleScroll() // initial check
    return () => container.removeEventListener("scroll", handleScroll)
  }, [questions])

  const scrollDown = () => {
    contentRef.current?.scrollBy({ top: 300, behavior: "smooth" })
  }

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`

  const handleSelectOption = useCallback(
    (questionId: string, option: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: option }))
    },
    []
  )

  const handleEssayChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
    },
    []
  )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const assessmentId = sessionStorage.getItem("oral-reading-assessmentId")
      if (!assessmentId) {
        setSubmitError("Assessment ID not found. Please go back and record first.")
        setIsSubmitting(false)
        return
      }

      // Check if a comprehension test already exists for this assessment
      try {
        const assessment = await getAssessmentByIdAction(assessmentId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingComp = (assessment as any)?.comprehension
        if (existingComp) {
          const tagBreakdown = computeTagBreakdown(existingComp.answers)
          setComprehensionResult({
            score: existingComp.score,
            totalItems: existingComp.totalItems,
            level: existingComp.level,
            comprehensionTestId: existingComp.id,
            tagBreakdown,
          })
          if (existingComp.id) {
            sessionStorage.setItem("oral-reading-comprehensionTestId", existingComp.id)
          }
          setIsSubmitted(true)
          return
        }
      } catch {
        // Assessment fetch failed — continue with submission
      }

      // Build answers array — { questionId, answer }
      const formattedAnswers = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          answer: answers[q.id],
        }))

      if (formattedAnswers.length === 0) {
        setSubmitError("Please answer at least one question before submitting.")
        setIsSubmitting(false)
        return
      }

      const response = await fetch("/api/oral-reading/comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, answers: formattedAnswers }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setSubmitError(result.error || "Failed to submit comprehension answers.")
        setIsSubmitting(false)
        return
      }

      // Fetch the full assessment to get tag breakdown
      let tagBreakdown: TagBreakdown | undefined
      try {
        const assessment = await getAssessmentByIdAction(assessmentId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const comp = (assessment as any)?.comprehension
        if (comp) {
          tagBreakdown = computeTagBreakdown(comp.answers)
        }
      } catch {
        // Failed to fetch tag breakdown — continue without it
      }

      setComprehensionResult({
        score: result.score,
        totalItems: result.totalItems,
        level: result.level,
        comprehensionTestId: result.comprehensionTestId,
        tagBreakdown,
      })

      // Store comprehensionTestId for the report page
      if (result.comprehensionTestId) {
        sessionStorage.setItem("oral-reading-comprehensionTestId", result.comprehensionTestId)
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error("Comprehension submit error:", err)
      setSubmitError("Something went wrong while submitting.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  const totalQuestions = questions.length

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Oral Reading Test" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#6666FF]" />
            <span className="text-[#00306E] font-medium">Loading questions...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Oral Reading Test" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <p className="text-red-600 font-medium">{loadError}</p>
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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <DashboardHeader title="Oral Reading Test" />

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        {/* Previous Button — above both columns */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#5555EE] md:text-base self-start"
          style={{ boxShadow: "0 0 20px rgba(102, 102, 255, 0.4), 0 4px 12px rgba(102, 102, 255, 0.3)" }}
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span>Previous</span>
        </button>

        {/* Two columns: left (info bar + scrollable questions) | right (breakdown aligned with timer top) */}
        <div className="flex flex-1 min-h-0 gap-4">
          {/* Left column */}
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            {/* Info Bar: Questions Info + Timer */}
            <div className="flex gap-4 shrink-0">
              <div className="flex-1 bg-[#EFFDFF] border border-[#10AABF] rounded-[20px] shadow-[0px_1px_20px_rgba(65,155,180,0.47)] px-8 py-5">
                <h2 className="text-[#00306E] font-bold text-lg">
                  Questions 1-{totalQuestions}
                </h2>
                <p className="text-[#00306E] font-medium text-[15px]">
                  Choose the correct answer
                </p>
              </div>
              <button
                onClick={togglePause}
                className={`w-[234px] bg-[#EFFDFF] border rounded-[20px] shadow-[0px_1px_20px_rgba(65,155,180,0.47)] flex items-center justify-center gap-3 shrink-0 transition-all cursor-pointer select-none ${
                  isPaused
                    ? "border-[#E53E3E] shadow-[0px_1px_20px_rgba(229,62,62,0.47)]"
                    : "border-[#10AABF]"
                }`}
                title={isPaused ? "Click to resume timer" : "Click to pause timer"}
              >
                <Clock className={`w-6 h-6 ${isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`} />
                <span className={`font-bold text-2xl tabular-nums ${isPaused ? "text-[#E53E3E]" : "text-[#00306E]"}`}>
                  {formattedTime}
                </span>
                {isPaused && (
                  <span className="text-[#E53E3E] text-xs font-semibold">PAUSED</span>
                )}
              </button>
            </div>

            {/* Scrollable questions */}
            <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth pr-2">

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-[#EFFDFF] border border-[#10AABF] rounded-[20px] shadow-[0px_1px_20px_rgba(65,155,180,0.47)] px-8 py-6"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0C1A6D] border-2 border-[#00306E] flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {question.questionNumber}
                  </span>
                </div>
                <h3 className="text-[#00306E] font-semibold text-[15px] leading-[35px]">
                  {question.questionText}
                </h3>
              </div>

              {/* Multiple Choice Options */}
              {question.type === "MULTIPLE_CHOICE" && question.options && (
                <div className="space-y-1 ml-10">
                  {question.options.map((option, index) => {
                    const label = OPTION_LABELS[index]
                    const isSelected = answers[question.id] === option

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleSelectOption(question.id, option)
                        }
                        disabled={isSubmitted}
                        className={`flex items-center gap-3 w-full text-left py-1 px-2 rounded-lg transition-all duration-200 ${
                          isSelected
                            ? "bg-[#162DB0]/10 shadow-[0px_0px_10px_rgba(255,176,32,0.3)]"
                            : "hover:bg-[#162DB0]/5"
                        } ${isSubmitted ? "cursor-default" : ""}`}
                      >
                        <div
                          className={`flex-shrink-0 w-7 h-[26px] rounded-full flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "bg-[#0C1A6D] border-2 border-[#00306E] shadow-[0px_0px_8px_rgba(255,176,32,0.5)]"
                              : "bg-[rgba(185,188,207,0.36)]"
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold ${
                              isSelected ? "text-white" : "text-[#0F2676]"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        <span className="text-[#00306E] text-[15px]">
                          {option}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Essay Input */}
              {question.type === "ESSAY" && (
                <div className="ml-10">
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleEssayChange(question.id, e.target.value)
                    }
                    disabled={isSubmitted}
                    placeholder="Type your answer here..."
                    className="w-full min-h-[50px] bg-[rgba(108,164,239,0.09)] rounded-md px-4 py-3 text-[#00306E] text-[15px] placeholder:text-[#00306E]/40 outline-none resize-y disabled:opacity-60"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center mt-8 mb-8 gap-2">
          {submitError && (
            <p className="text-red-600 text-sm font-medium">{submitError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmitted}
            className="w-[225px] h-[63px] bg-[#2E2E68] border border-[#7A7AFB] rounded-lg shadow-[0px_1px_20px_rgba(65,155,180,0.47)] text-white font-semibold text-xl hover:bg-[#2E2E68]/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"}
          </button>
        </div>
        </div>
          </div>

          {/* Right column: Comprehension Breakdown — top aligned with timer */}
          <div className="w-[280px] shrink-0 md:w-[300px] lg:w-[320px]">
            <ComprehensionBreakdown
              score={comprehensionResult?.score}
              totalItems={comprehensionResult?.totalItems}
              level={comprehensionResult?.level}
              tagBreakdown={comprehensionResult?.tagBreakdown}
              disabled={!isSubmitted}
            />
          </div>
        </div>
      </div>

      {/* Scroll Down Button */}
      {showScrollButton && (
        <button
          onClick={scrollDown}
          className="absolute bottom-6 right-10 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#6666FF] text-white shadow-lg transition-all hover:bg-[#5555EE] animate-bounce"
          style={{ boxShadow: "0 0 16px rgba(102, 102, 255, 0.5)" }}
          aria-label="Scroll down"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
