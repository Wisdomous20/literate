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

interface Passage {
  id: string;
  title: string;
  language: "Filipino" | "English";
  level: number;
  tags: "Literal" | "Inferential" | "Critical";
  testType: "PRE_TEST" | "POST_TEST";
  content: string;
  wordCount: number;
  questionsCount: number;
}

interface PassageTableProps {
  passages: Passage[];
  onEdit: (passage: Passage) => void;
  onDelete: (id: string) => void;
  onView: (passage: Passage) => void;
  isDeleting?: string | null;
}

function getLevelLabel(level: number): string {
  if (level === 0) return "Kindergarten";
  return `Grade ${level}`;
}

function getTestTypeLabel(testType: string): string {
  return testType === "PRE_TEST" ? "Pre-Test" : "Post-Test";
}

export function PassageTable({
  passages,
  onEdit,
  onDelete,
  onView,
  isDeleting,
}: PassageTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<
    "all" | "Filipino" | "English"
  >("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const passagesPerPage = 8;

  const filteredPassages = passages.filter((p) => {
    const matchesSearch = p.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLang =
      languageFilter === "all" || p.language === languageFilter;
    const matchesLevel =
      levelFilter === "all" || String(p.level) === levelFilter;
    return matchesSearch && matchesLang && matchesLevel;
  });

  const totalPages = Math.ceil(filteredPassages.length / passagesPerPage);
  const paginatedPassages = filteredPassages.slice(
    (currentPage - 1) * passagesPerPage,
    currentPage * passagesPerPage,
  );

  const levelOptions = Array.from({ length: 13 }, (_, i) => ({
    label: i === 0 ? "Kindergarten" : `Grade ${i}`,
    value: String(i),
  }));

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
              placeholder="Search passages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#00306E] placeholder:text-[#00306E]/60 outline-none"
            />
          </div>

          {/* Language Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsLevelOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              <span>
                {languageFilter === "all" ? "Language" : languageFilter}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isLangOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
                {["all", "Filipino", "English"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguageFilter(lang as typeof languageFilter);
                      setIsLangOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      languageFilter === lang
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {lang === "all" ? "All Languages" : lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Level Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLevelOpen(!isLevelOpen);
                setIsLangOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#5D5DFB]/20 bg-white px-4 py-2.5 text-sm font-medium text-[#00306E] transition-colors hover:bg-[#E4F4FF]"
            >
              <span>
                {levelFilter === "all"
                  ? "Level"
                  : getLevelLabel(Number(levelFilter))}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isLevelOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-44 overflow-auto rounded-lg bg-white py-1 shadow-[0px_4px_20px_rgba(0,48,110,0.15)]">
                <button
                  onClick={() => {
                    setLevelFilter("all");
                    setIsLevelOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                    levelFilter === "all"
                      ? "font-semibold text-[#6666FF]"
                      : "text-[#00306E]"
                  }`}
                >
                  All Levels
                </button>
                {levelOptions.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => {
                      setLevelFilter(l.value);
                      setIsLevelOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                      levelFilter === l.value
                        ? "font-semibold text-[#6666FF]"
                        : "text-[#00306E]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Count */}
        <span className="text-[15px] font-bold text-[#162DB0]">
          {filteredPassages.length} Total Passages
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-t-[5px] border border-[rgba(74,74,252,0.08)] bg-[#E4F4FF]">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_80px_100px] border border-[rgba(74,74,252,0.08)] bg-[rgba(74,74,252,0.12)] px-6 py-3">
          <span className="text-[15px] font-medium text-[#00306E]">Title</span>
          <span className="text-[15px] font-medium text-[#00306E]">
            Language
          </span>
          <span className="text-[15px] font-medium text-[#00306E]">Level</span>
          <span className="text-[15px] font-medium text-[#00306E]">Tags</span>
          <span className="text-[15px] font-medium text-[#00306E]">
            Test Type
          </span>
          <span className="text-[15px] font-medium text-[#00306E]">Words</span>
          <span className="text-[15px] font-medium text-[#00306E]">
            {"Q's"}
          </span>
          <span className="text-right text-[15px] font-medium text-[#00306E]">
            Actions
          </span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[rgba(74,74,252,0.08)]">
          {paginatedPassages.map((passage) => {
            const tagColors = {
              Literal: { bg: "rgba(46, 139, 87, 0.12)", color: "#2E8B57" },
              Inferential: { bg: "rgba(84, 164, 255, 0.12)", color: "#54A4FF" },
              Critical: { bg: "rgba(212, 160, 23, 0.12)", color: "#D4A017" },
            };
            return (
              <div
                key={passage.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_80px_100px] items-center px-6 py-3.5"
              >
                <span className="truncate text-sm font-medium text-[#00306E]">
                  {passage.title}
                </span>
                <span className="text-sm text-[#00306E]">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      passage.language === "Filipino"
                        ? "bg-[rgba(102,102,255,0.12)] text-[#6666FF]"
                        : "bg-[rgba(84,164,255,0.12)] text-[#54A4FF]"
                    }`}
                  >
                    {passage.language === "Filipino" ? "FIL" : "ENG"}
                  </span>
                </span>
                <span className="text-sm text-[#00306E]">
                  {getLevelLabel(passage.level)}
                </span>
                <span className="text-sm">
                  <span
  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[passage.tags]}`}
>

                    {passage.tags}
                  </span>
                </span>
                <span className="text-sm text-[#00306E]">
                  <span
  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[passage.tags]}`}
>

                    {getTestTypeLabel(passage.testType)}
                  </span>
                </span>
                <span className="text-sm text-[#00306E]">
                  {passage.wordCount}
                </span>
                <span className="text-sm text-[#00306E]">
                  {passage.questionsCount}
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(passage)}
                    className="text-[#54A4FF] transition-opacity hover:opacity-70 disabled:opacity-50"
                    title="View"
                    disabled={isDeleting === passage.id}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(passage)}
                    className="text-[#162DB0] transition-opacity hover:opacity-70 disabled:opacity-50"
                    title="Edit"
                    disabled={isDeleting === passage.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(passage.id)}
                    className="text-[#DE3B40] transition-opacity hover:opacity-70 disabled:opacity-50"
                    title="Delete"
                    disabled={isDeleting === passage.id}
                  >
                    {isDeleting === passage.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#DE3B40] border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {paginatedPassages.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-[#00306E]/50">
              No passages found
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
          {/* First page */}
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
                type="button"
                title={
                  typeof pageNum === "number"
                    ? `Go to page ${pageNum}`
                    : undefined
                }
                aria-label={
                  typeof pageNum === "number"
                    ? `Go to page ${pageNum}`
                    : undefined
                }
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

          {/* Last page */}
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