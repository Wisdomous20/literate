"use client"

import { useState } from "react"
import { QuestionTable } from "@/components/admin-dash/questionTable"
import { CreateQuestionModal } from "@/components/admin-dash/createQuestionModal"

// Mock passages for the dropdown
const mockPassages = [
  { id: "1", title: "Ang Munting Ibon" },
  { id: "2", title: "The Little Red Hen" },
  { id: "3", title: "Si Juan at ang Daga" },
  { id: "4", title: "A Day at the Farm" },
  { id: "5", title: "Ang Pagong at ang Matsing" },
  { id: "6", title: "The Sun and the Wind" },
  { id: "7", title: "Ang Alamat ng Pinya" },
  { id: "8", title: "The Water Cycle" },
]

// Mock questions aligned with Prisma schema
// tags: Literal | Inferential | Critical, type: MULTIPLE_CHOICE | ESSAY
const mockQuestions = [
  { id: "1", questionText: "Ano ang pangalan ng ibon sa kwento?", passageTitle: "Ang Munting Ibon", tags: "Literal" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 1, language: "Filipino" as const },
  { id: "2", questionText: "What did the Little Red Hen want to do?", passageTitle: "The Little Red Hen", tags: "Literal" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 1, language: "English" as const },
  { id: "3", questionText: "Bakit natatakot si Juan sa daga?", passageTitle: "Si Juan at ang Daga", tags: "Inferential" as const, type: "ESSAY" as const, passageLevel: 2, language: "Filipino" as const },
  { id: "4", questionText: "What lesson can we learn from the farm animals?", passageTitle: "A Day at the Farm", tags: "Critical" as const, type: "ESSAY" as const, passageLevel: 2, language: "English" as const },
  { id: "5", questionText: "Sino ang mas matalino, ang pagong o ang matsing?", passageTitle: "Ang Pagong at ang Matsing", tags: "Critical" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 3, language: "Filipino" as const },
  { id: "6", questionText: "Why did the sun win the contest?", passageTitle: "The Sun and the Wind", tags: "Inferential" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 3, language: "English" as const },
  { id: "7", questionText: "Ano ang naging pinya ayon sa alamat?", passageTitle: "Ang Alamat ng Pinya", tags: "Literal" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 4, language: "Filipino" as const },
  { id: "8", questionText: "How does evaporation contribute to the water cycle?", passageTitle: "The Water Cycle", tags: "Inferential" as const, type: "ESSAY" as const, passageLevel: 4, language: "English" as const },
  { id: "9", questionText: "Do you think the characters made the right decision?", passageTitle: "Ang Pagong at ang Matsing", tags: "Critical" as const, type: "ESSAY" as const, passageLevel: 3, language: "Filipino" as const },
  { id: "10", questionText: "What is the main idea of the passage?", passageTitle: "The Sun and the Wind", tags: "Literal" as const, type: "MULTIPLE_CHOICE" as const, passageLevel: 3, language: "English" as const },
]

export default function QuestionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateQuestion = (data: {
    questionText: string
    quizId: string
    tags: string
    type: string
    options: string[] | null
    correctAnswer: string | null
  }) => {
    console.log("Creating question:", data)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header
        className="flex h-[118px] items-center justify-between px-10"
        style={{
          borderBottom: "1px solid #8D8DEC",
          boxShadow: "0px 4px 4px #54A4FF",
          background: "transparent",
          borderTopLeftRadius: "50px",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
            <div className="h-2.5 w-2.5 rounded-sm bg-[#31318A]" />
          </div>
          <h1 className="text-[25px] font-semibold leading-[38px] text-[#31318A]">
            Comprehension Questions
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{
            background: "#2E2E68",
            border: "1px solid #7A7AFB",
            boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
          }}
        >
          Create Question
        </button>
      </header>

      <main className="flex flex-1 flex-col px-8 py-6">
        <QuestionTable
          questions={mockQuestions}
          onEdit={(q) => console.log("Edit:", q)}
          onDelete={(id) => console.log("Delete:", id)}
        />
      </main>

      <CreateQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateQuestion={handleCreateQuestion}
        passages={mockPassages}
      />
    </div>
  )
}
