"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, Clock } from "lucide-react"
import { DashboardHeader } from "@/components/auth/dashboard/dashboardHeader"
import { ComprehensionBreakdown } from "@/components/oral-reading-test/comprehensionBreakdown"

const OPTION_LABELS = ["A", "B", "C", "D"]

interface QuestionData {
  id: string
  questionNumber: number
  questionText: string
  type: "MULTIPLE_CHOICE" | "ESSAY"
  options?: string[]
}

// Mock questions — replace with real API fetch later
const MOCK_QUESTIONS: QuestionData[] = [
  {
    id: "q1",
    questionNumber: 1,
    questionText: "What did I do to deserve this?",
    type: "MULTIPLE_CHOICE",
    options: ["Nothing", "Shut up", "Ok", "Just deal with it"],
  },
  {
    id: "q2",
    questionNumber: 2,
    questionText: "What did I do to deserve this?",
    type: "MULTIPLE_CHOICE",
    options: ["Nothing", "Shut up", "Ok", "Just deal with it"],
  },
  {
    id: "q3",
    questionNumber: 3,
    questionText: "What did I do to deserve this?",
    type: "ESSAY",
  },
]

export default function OralReadingComprehensionPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [questions] = useState<QuestionData[]>(MOCK_QUESTIONS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  // Timer — stops when submitted
  useEffect(() => {
    if (isSubmitted) return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isSubmitted])

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
    // TODO: Submit answers to API
    console.log("Submitted answers:", answers)
    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  const handleGoBack = () => {
    router.back()
  }

  const totalQuestions = questions.length

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
              <div className="w-[234px] bg-[#EFFDFF] border border-[#10AABF] rounded-[20px] shadow-[0px_1px_20px_rgba(65,155,180,0.47)] flex items-center justify-center gap-3 shrink-0">
                <Clock className="w-6 h-6 text-[#00306E]" />
                <span className="text-[#00306E] font-bold text-2xl tabular-nums">
                  {formattedTime}
                </span>
              </div>
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
                        className={`flex items-center gap-3 w-full text-left py-1 px-2 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-[#162DB0]/10"
                            : "hover:bg-[#162DB0]/5"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-7 h-[26px] rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-[#0C1A6D] border-2 border-[#00306E]"
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
                    placeholder="Type your answer here..."
                    className="w-full min-h-[50px] bg-[rgba(108,164,239,0.09)] rounded-md px-4 py-3 text-[#00306E] text-[15px] placeholder:text-[#00306E]/40 outline-none resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8 mb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-[225px] h-[63px] bg-[#2E2E68] border border-[#7A7AFB] rounded-lg shadow-[0px_1px_20px_rgba(65,155,180,0.47)] text-white font-semibold text-xl hover:bg-[#2E2E68]/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
        </div>
          </div>

          {/* Right column: Comprehension Breakdown — top aligned with timer */}
          <div className="w-[280px] shrink-0 md:w-[300px] lg:w-[320px]">
            <ComprehensionBreakdown disabled={!isSubmitted} />
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
