"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";

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

function getLevelLabel(level: number): string {
  if (level === 0) return "K";
  return `Grade ${level}`;
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
  const [typeFilter, setTypeFilter] = useState<
    "all" | "MULTIPLE_CHOICE" | "ESSAY"
  >("all");
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 8;

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.passageTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = tagFilter === "all" || q.tags === tagFilter;
    const matchesType = typeFilter === "all" || q.type === typeFilter;
    return matchesSearch && matchesTag && matchesType;
  });

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage,
  );

  const tagColors = {
    Literal: { bg: "rgba(46, 139, 87, 0.12)", color: "#2E8B57" },
    Inferential: { bg: "rgba(84, 164, 255, 0.12)", color: "#54A4FF" },
    Critical: { bg: "rgba(212, 160, 23, 0.12)", color: "#D4A017" },
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Filters Row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex w-[320px] items-center gap-3 rounded-full border border-[rgba(84,164,255,0.38)] bg-[#F4FCFD] px-4 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4F4FF]">
              <Search className="h-4 w-4 text-[#162DB0]" />
            </div>
            <input
              type="text"
              placeholder="Search questions or passages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#00306E] placeholder:text-[#00306E]/60 outline-none"
            />
          </div>

          {/* Tags Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsTagOpen(!isTagOpen);
                setIsTypeOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              <span>{tagFilter === "all" ? "Tags" : tagFilter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isTagOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-lg bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
                {(["all", "Literal", "Inferential", "Critical"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTagFilter(t);
                        setIsTagOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                        tagFilter === t
                          ? "font-semibold text-[#6666FF]"
                          : "text-[#00306E]"
                      }`}
                    >
                      {t === "all" ? "All Tags" : t}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsTypeOpen(!isTypeOpen);
                setIsTagOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              <span>
                {typeFilter === "all"
                  ? "Type"
                  : typeFilter === "MULTIPLE_CHOICE"
                    ? "Multiple Choice"
                    : "Essay"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isTypeOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-lg bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
                {(["all", "MULTIPLE_CHOICE", "ESSAY"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setIsTypeOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      typeFilter === t
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {t === "all"
                      ? "All Types"
                      : t === "MULTIPLE_CHOICE"
                        ? "Multiple Choice"
                        : "Essay"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Count */}
        <span className="text-[15px] font-bold text-[#162DB0]">
          {filteredQuestions.length} Total Questions
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-t-[5px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_100px] border border-[rgba(74,74,252,0.08)] bg-[rgba(74,74,252,0.12)] px-6 py-3">
          <span className="text-[15px] font-medium text-[#00306E]">
            Question
          </span>
          <span className="text-[15px] font-medium text-[#00306E]">
            Passage
          </span>
          <span className="text-[15px] font-medium text-[#00306E]">Type</span>
          <span className="text-[15px] font-medium text-[#00306E]">Tags</span>
          <span className="text-[15px] font-medium text-[#00306E]">Level</span>
          <span className="text-right text-[15px] font-medium text-[#00306E]">
            Actions
          </span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[rgba(74,74,252,0.08)]">
          {paginatedQuestions.map((question) => (
            <div
              key={question.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_100px] items-center px-6 py-3.5"
            >
              <span className="truncate text-sm font-medium text-[#00306E]">
                {question.questionText}
              </span>
              <span className="truncate text-sm text-[#00306E]">
                {question.passageTitle}
              </span>
              <span className="text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    question.type === "MULTIPLE_CHOICE"
                      ? "bg-[rgba(102,102,255,0.12)] text-[#6666FF]"
                      : "bg-[rgba(84,164,255,0.12)] text-[#54A4FF]"
                  }`}
                >
                  {question.type === "MULTIPLE_CHOICE" ? "M.C" : "Essay"}
                </span>
              </span>
              <span className="text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[question.tags]}`}
                >
                  {question.tags}
                </span>
              </span>
              <span className="text-sm text-[#00306E]">
                {getLevelLabel(question.passageLevel)}
              </span>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onView(question)}
                  className="text-[#54A4FF] transition-opacity hover:opacity-70"
                  title="View"
                  disabled={isDeleting === question.id}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(question)}
                  className="text-[#162DB0] transition-opacity hover:opacity-70"
                  title="Edit"
                  disabled={isDeleting === question.id}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(question.id)}
                  className="text-[#DE3B40] transition-opacity hover:opacity-70 disabled:opacity-50"
                  title="Delete"
                  disabled={isDeleting === question.id}
                >
                  {isDeleting === question.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#DE3B40] border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {paginatedQuestions.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-[#00306E]/50">
              No questions found
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-[#00306E]">
          Page {currentPage} of {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="First page"
            aria-label="Go to first page"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/20 bg-white text-[#00306E] disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="-ml-2 h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number | string = i + 1;
            if (totalPages > 5) {
              if (i === 3) pageNum = "...";
              else if (i === 4) pageNum = totalPages;
            }
            return (
              <button
                key={i}
                onClick={() =>
                  typeof pageNum === "number" && setCurrentPage(pageNum)
                }
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium ${
                  currentPage === pageNum
                    ? "bg-[#162DB0] text-white"
                    : "border border-[#162DB0]/20 bg-white text-[#00306E]"
                }`}
                disabled={pageNum === "..."}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            title="Last page"
            aria-label="Go to last page"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/20 bg-white text-[#00306E] disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="-ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
