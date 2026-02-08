"use client"

import Link from "next/link"
import { PassageTable } from "@/components/admin-dash/passageTable"

// Mock data aligned with Prisma schema
// level: Int, testType: PRE_TEST | POST_TEST, tags: Literal | Inferential | Critical
const mockPassages = [
  { id: "1", title: "Ang Munting Ibon", language: "Filipino" as const, level: 1, tags: "Literal" as const, testType: "PRE_TEST" as const, wordCount: 85, questionsCount: 5 },
  { id: "2", title: "The Little Red Hen", language: "English" as const, level: 1, tags: "Literal" as const, testType: "PRE_TEST" as const, wordCount: 102, questionsCount: 5 },
  { id: "3", title: "Si Juan at ang Daga", language: "Filipino" as const, level: 2, tags: "Inferential" as const, testType: "POST_TEST" as const, wordCount: 130, questionsCount: 6 },
  { id: "4", title: "A Day at the Farm", language: "English" as const, level: 2, tags: "Critical" as const, testType: "PRE_TEST" as const, wordCount: 115, questionsCount: 5 },
  { id: "5", title: "Ang Pagong at ang Matsing", language: "Filipino" as const, level: 3, tags: "Inferential" as const, testType: "PRE_TEST" as const, wordCount: 168, questionsCount: 7 },
  { id: "6", title: "The Sun and the Wind", language: "English" as const, level: 3, tags: "Critical" as const, testType: "POST_TEST" as const, wordCount: 155, questionsCount: 6 },
  { id: "7", title: "Ang Alamat ng Pinya", language: "Filipino" as const, level: 4, tags: "Literal" as const, testType: "POST_TEST" as const, wordCount: 210, questionsCount: 8 },
  { id: "8", title: "The Water Cycle", language: "English" as const, level: 4, tags: "Inferential" as const, testType: "PRE_TEST" as const, wordCount: 195, questionsCount: 7 },
  { id: "9", title: "Ang Singsing ni Pedro", language: "Filipino" as const, level: 5, tags: "Critical" as const, testType: "POST_TEST" as const, wordCount: 245, questionsCount: 8 },
  { id: "10", title: "Exploring the Rainforest", language: "English" as const, level: 5, tags: "Literal" as const, testType: "PRE_TEST" as const, wordCount: 260, questionsCount: 8 },
  { id: "11", title: "Ang Kwento ni Rizal", language: "Filipino" as const, level: 6, tags: "Critical" as const, testType: "POST_TEST" as const, wordCount: 310, questionsCount: 10 },
  { id: "12", title: "The Solar System", language: "English" as const, level: 6, tags: "Inferential" as const, testType: "PRE_TEST" as const, wordCount: 290, questionsCount: 9 },
]

export default function PassagesPage() {
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
            Graded Passages
          </h1>
        </div>
        <Link
          href="/admin-dash/passages/create"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{
            background: "#2E2E68",
            border: "1px solid #7A7AFB",
            boxShadow: "0px 1px 20px rgba(65, 155, 180, 0.47)",
          }}
        >
          Create Passage
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-8 py-6">
        <PassageTable
          passages={mockPassages}
          onEdit={(p) => console.log("Edit:", p)}
          onDelete={(id) => console.log("Delete:", id)}
          onView={(p) => console.log("View:", p)}
        />
      </main>
    </div>
  )
}