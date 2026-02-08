"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface Passage {
  id: string
  title: string
}

const tagOptions = ["Literal", "Inferential", "Critical"]
const questionTypes = [
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE" },
  { label: "Essay", value: "ESSAY" },
]

// Mock passages - replace with actual API call
const mockPassages: Passage[] = [
  { id: "1", title: "Ang Muniting Ibon" },
  { id: "2", title: "The Little Red Hen" },
  { id: "3", title: "Si Juan at ang Daga" },
  { id: "4", title: "A Day at the Farm" },
  { id: "5", title: "Ang Pagong at ang Matsing" },
  { id: "6", title: "The Sun and the Wind" },
  { id: "7", title: "Ang Alamat ng Pinya" },
  { id: "8", title: "The Water Cycle" },
]

export function CreateQuestionForm() {
  const router = useRouter()
  const [questionText, setQuestionText] = useState("")
  const [passageId, setPassageId] = useState("")
  const [tags, setTags] = useState("")
  const [type, setType] = useState("")
  const [options, setOptions] = useState<string[]>(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (questionText.trim() && passageId && tags && type) {
        try {
          // Replace with your actual API call
          console.log("Creating question:", {
            questionText,
            quizId: passageId,
            tags,
            type,
            options: type === "MULTIPLE_CHOICE" ? options.filter(Boolean) : null,
            correctAnswer: type === "MULTIPLE_CHOICE" ? correctAnswer : null,
          })
          // await createQuestion({...})
          router.push("/admin-dash/questions")
        } catch (error) {
          console.error("Error creating question:", error)
        }
      }
    },
    [questionText, passageId, tags, type, options, correctAnswer, router]
  )

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      if (correctAnswer === options[index]) {
        setCorrectAnswer("")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Passage */}
      <div className="flex items-center gap-6">
        <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
          Passage
        </label>
        <div className="relative flex-1">
          <select
            value={passageId}
            onChange={(e) => setPassageId(e.target.value)}
            className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF]"
            style={{ boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)" }}
          >
            <option value="">Select passage</option>
            {mockPassages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
        </div>
      </div>

      {/* Question Text */}
      <div className="flex gap-6">
        <label className="w-[140px] shrink-0 pt-3 text-base font-semibold text-[#00306E]">
          Question
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="flex-1 resize-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF]"
          style={{ boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)" }}
          placeholder="Enter the comprehension question..."
        />
      </div>

      {/* Tags (Literal / Inferential / Critical) */}
      <div className="flex items-center gap-6">
        <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
          Tags
        </label>
        <div className="flex flex-1 gap-3">
          {tagOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(t)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                tags === t
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Description */}
      {tags && (
        <div className="ml-[164px] rounded-lg bg-[#E4F4FF]/60 px-4 py-3">
          <p className="text-xs text-[#00306E]/70">
            {tags === "Literal" &&
              "Literal questions ask about information directly stated in the passage."}
            {tags === "Inferential" &&
              "Inferential questions require the reader to draw conclusions beyond what is explicitly stated."}
            {tags === "Critical" &&
              "Critical questions require the reader to evaluate, judge, or form opinions about the text."}
          </p>
        </div>
      )}

      {/* Question Type (MULTIPLE_CHOICE / ESSAY) */}
      <div className="flex items-center gap-6">
        <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
          Type
        </label>
        <div className="flex flex-1 gap-3">
          {questionTypes.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => setType(qt.value)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                type === qt.value
                  ? "border-[#6666FF] bg-[#6666FF]/10 text-[#6666FF]"
                  : "border-[#E4F4FF] bg-white text-[#00306E]/60 hover:border-[#6666FF]/30"
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multiple Choice Options */}
      {type === "MULTIPLE_CHOICE" && (
        <>
          <div className="flex gap-6">
            <label className="w-[140px] shrink-0 pt-3 text-base font-semibold text-[#00306E]">
              Options
            </label>
            <div className="flex flex-1 flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm font-semibold text-[#00306E]/50">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-2.5 text-sm text-[#00306E] outline-none transition-colors focus:border-[#6666FF]"
                    style={{ boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)" }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-[#DE3B40]/60 transition-colors hover:text-[#DE3B40]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 self-start rounded-lg px-3 py-1.5 text-xs font-medium text-[#6666FF] transition-colors hover:bg-[#6666FF]/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </button>
              )}
            </div>
          </div>

          {/* Correct Answer */}
          <div className="flex items-center gap-6">
            <label className="w-[140px] shrink-0 text-base font-semibold text-[#00306E]">
              Correct Answer
            </label>
            <div className="relative flex-1">
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full appearance-none rounded-lg border-2 border-[#E4F4FF] bg-white px-4 py-3 text-base text-[#00306E] outline-none transition-colors focus:border-[#6666FF]"
                style={{ boxShadow: "inset 0px 2px 4px rgba(0, 48, 110, 0.08)" }}
              >
                <option value="">Select correct answer</option>
                {options.filter(Boolean).map((opt, i) => (
                  <option key={i} value={opt}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00306E]/50" />
            </div>
          </div>
        </>
      )}

      {/* Submit */}
      <div className="flex justify-center gap-4 pt-8">
        <Link
          href="/admin-dash/questions"
          className="rounded-lg px-10 py-3 text-base font-semibold text-[#00306E] transition-all hover:bg-[#E4F4FF]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-lg px-10 py-3 text-base font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "#2E2E68",
            boxShadow: "0px 4px 15px rgba(46, 46, 104, 0.4)",
          }}
        >
          Create Question
        </button>
      </div>
    </form>
  )
}