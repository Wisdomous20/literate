"use client";

import { useState } from "react";

interface Question {
  id: string;
  questionText: string;
  passageTitle: string;
  tags: "Literal" | "Inferential" | "Critical";
  type: "MULTIPLE_CHOICE" | "ESSAY";
  passageLevel: number;
  language: "Filipino" | "English";
}

interface QuestionTableProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onView: (question: Question) => void;
  isDeleting?: string | null;
}

export function QuestionTable({
  questions,
  onEdit,
  onDelete,
  onView,
  isDeleting,
}: QuestionTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<
    "all" | "Literal" | "Inferential" | "Critical"
  >("all");

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTag = tagFilter === "all" || q.tags === tagFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-[#E4F4FF] px-4 py-2 text-sm"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value as any)}
          className="rounded-lg border border-[#E4F4FF] px-4 py-2 text-sm"
        >
          <option value="all">All Tags</option>
          <option value="Literal">Literal</option>
          <option value="Inferential">Inferential</option>
          <option value="Critical">Critical</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-[#F4FCFD]">
              <th className="px-4 py-2 text-left">Question</th>
              <th className="px-4 py-2 text-left">Tag</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Language</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-[#00306E]/60"
                >
                  No questions found.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q) => (
                <tr key={q.id} className="border-b border-[#E4F4FF]">
                  <td className="px-4 py-2">{q.questionText}</td>
                  <td className="px-4 py-2">{q.tags}</td>
                  <td className="px-4 py-2">
                    {q.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "Essay"}
                  </td>
                  <td className="px-4 py-2">{q.language}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => onView(q)}
                      className="text-[#2E2E68] hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(q)}
                      className="text-[#54A4FF] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(q.id)}
                      className="text-[#DE3B40] hover:underline"
                      disabled={isDeleting === q.id}
                    >
                      {isDeleting === q.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
