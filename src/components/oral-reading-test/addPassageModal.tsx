"use client";

import { useState } from "react";
import { X, ChevronDown, List, LayoutGrid, FileText, Globe, BarChart3, ClipboardList, Search, type LucideIcon } from "lucide-react";
import { usePassageList } from "@/lib/hooks/usePassageList";

interface Passage {
  id: string;
  title: string;
  content: string;
  language: string;
  level: number;
  tags: string;
  testType: string;
  createdAt: Date;
  updatedAt: Date;
}

function formatLevel(level: number): string {
  return level === 0 ? "Kindergarten" : `Grade ${level}`;
}

function formatTestType(testType: string): string {
  switch (testType) {
    case "PRE_TEST":
      return "Pre-Test";
    case "POST_TEST":
      return "Post-Test";
    default:
      return testType;
  }
}

const PASSAGE_LEVELS = [
  "All Levels",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];
const TEST_TYPES = ["All", "Pre-Test", "Post-Test"];
const LANGUAGES = ["All Languages", "English", "Filipino"];

interface AddPassageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassage: (passage: Passage) => void;
}

function FilterDropdown({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isFiltered = options[0] !== value;

  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={label}
        title={label}
        className={`flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-medium shadow-[0px_1px_20px_rgba(108,164,239,0.37)] ${
          isFiltered
            ? "border-[#6666FF] bg-[#EEEEFF] text-[#31318A]"
            : "border-[#54A4FF] bg-[#EFFDFF] text-[#00306E]"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-[#5D5DFB]" />
        <span className="flex-1 text-left">
          <span className="font-normal text-[#00306E]/60">{label}:</span>{" "}
          <span className={isFiltered ? "font-semibold text-[#31318A]" : "italic text-[#00306E]/35"}>
            {isFiltered ? value : "All"}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#03438D] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#54A4FF] bg-white py-1 shadow-[0px_4px_12px_rgba(84,164,255,0.2)]">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#E4F4FF] ${
                  value === opt
                    ? "font-semibold text-[#5D5DFB]"
                    : "font-medium text-[#00306E]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AddPassageModal({
  isOpen,
  onClose,
  onSelectPassage,
}: AddPassageModalProps) {
  const [selectedLevel, setSelectedLevel] = useState(PASSAGE_LEVELS[0]);
  const [selectedTestType, setSelectedTestType] = useState(TEST_TYPES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: passages = [], isLoading, error } = usePassageList();

  if (!isOpen) return null;

  const filteredPassages = (passages as Passage[]).filter((p) => {
    if (
      selectedLevel !== PASSAGE_LEVELS[0] &&
      formatLevel(p.level) !== selectedLevel
    )
      return false;
    if (
      selectedTestType !== TEST_TYPES[0] &&
      formatTestType(p.testType) !== selectedTestType
    )
      return false;
    if (selectedLanguage !== LANGUAGES[0] && p.language !== selectedLanguage)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesContent = p.content.toLowerCase().includes(q);
      const matchesLevel = formatLevel(p.level).toLowerCase().includes(q);
      const matchesLanguage = p.language.toLowerCase().includes(q);
      const matchesTestType = formatTestType(p.testType).toLowerCase().includes(q);
      if (!matchesTitle && !matchesContent && !matchesLevel && !matchesLanguage && !matchesTestType)
        return false;
    }
    return true;
  });

  const handleSelect = () => {
    const passage = filteredPassages.find((p) => p.id === selectedPassageId);
    if (passage) {
      onSelectPassage(passage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(116,128,136,0.53)]"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-205 max-h-[85vh] flex-col overflow-hidden rounded-4xl border border-[#54A4FF] bg-[#EFFDFF] shadow-[0px_1px_20px_rgba(108,164,239,0.37)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-8 pb-4 pt-6">
          <h2 className="font-[Poppins,sans-serif] text-[25px] font-bold text-[#5D5DFB]">
            Select a Passage
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-lg border border-[#54A4FF]">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-9 w-10 items-center justify-center transition-colors ${
                  viewMode === "list" ? "bg-[#5D5DFB]" : "bg-[#EFFDFF]"
                }`}
                title="List view"
                aria-label="List view"
              >
                <List
                  className={`h-4.5 w-4.5 ${
                    viewMode === "list" ? "text-white" : "text-[#00306E]"
                  }`}
                />
              </button>
              <div className="h-9 w-px bg-[#54A4FF]" />
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-9 w-10 items-center justify-center transition-colors ${
                  viewMode === "grid" ? "bg-[#5D5DFB]" : "bg-[#EFFDFF]"
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid
                  className={`h-4.5 w-4.5 ${
                    viewMode === "grid" ? "text-white" : "text-[#00306E]"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              aria-label="Close modal"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#E4F4FF]"
            >
              <X className="h-5 w-5 text-[#00306E]" />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
          {/* Search Bar */}
          <div className="relative mb-3 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D5DFB]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, content, grade level, language, or test type..."
              className="w-full rounded-[10px] border border-[#54A4FF] bg-white py-2.5 pl-9 pr-9 text-sm text-[#00306E] shadow-[0px_1px_10px_rgba(108,164,239,0.2)] outline-none placeholder:text-[#00306E]/40 focus:border-[#6666FF] focus:shadow-[0px_1px_14px_rgba(102,102,255,0.25)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00306E]/40 hover:text-[#00306E]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4 flex shrink-0 gap-3">
            <FilterDropdown
              label="Passage Level"
              icon={BarChart3}
              options={PASSAGE_LEVELS}
              value={selectedLevel}
              onChange={setSelectedLevel}
            />
            <FilterDropdown
              label="Test Type"
              icon={ClipboardList}
              options={TEST_TYPES}
              value={selectedTestType}
              onChange={setSelectedTestType}
            />
            <FilterDropdown
              label="Language"
              icon={Globe}
              options={LANGUAGES}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
            />
          </div>

          {/* Results Count */}
          <p className="mb-3 shrink-0 font-[Kanit,sans-serif] text-[20px] font-medium text-[rgba(34,34,139,0.81)]">
            Results: {filteredPassages.length}
          </p>

          {/* Loading / Error / Passage List */}
          <div className="min-h-0 flex-1 overflow-auto pr-1">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-lg border border-[rgba(84,164,255,0.3)] bg-white px-4 py-3"
                  >
                    <div className="h-5 w-5 shrink-0 rounded bg-[#D5E7FE]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 rounded bg-[#D5E7FE]" />
                      <div className="h-3 w-1/2 rounded bg-[#D5E7FE]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-red-500">{error instanceof Error ? error.message : "Failed to load passages"}</p>
              </div>
            ) : filteredPassages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-[#00306E]/40">No passages found</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-2">
                {filteredPassages.map((passage) => (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => setSelectedPassageId(passage.id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedPassageId === passage.id
                        ? "border-[#5D5DFB] bg-[rgba(93,93,251,0.1)]"
                        : "border-[rgba(84,164,255,0.3)] bg-white"
                    }`}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-[#5D5DFB]" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#00306E]">
                        {passage.title}
                      </p>
                      <p className="text-xs text-[#6B7DB3]">
                        {passage.language} • {formatLevel(passage.level)} •{" "}
                        {formatTestType(passage.testType)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredPassages.map((passage) => (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => setSelectedPassageId(passage.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-center transition-colors ${
                      selectedPassageId === passage.id
                        ? "border-[#5D5DFB] bg-[rgba(93,93,251,0.1)]"
                        : "border-[rgba(84,164,255,0.3)] bg-white"
                    }`}
                  >
                    <FileText className="h-6 w-6 text-[#5D5DFB]" />
                    <p className="text-sm font-semibold text-[#00306E]">
                      {passage.title}
                    </p>
                    <p className="text-xs text-[#6B7DB3]">
                      {passage.language} • {formatLevel(passage.level)} •{" "}
                      {formatTestType(passage.testType)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select Button */}
          <div className="mt-4 flex shrink-0 justify-end">
            <button
              type="button"
              onClick={handleSelect}
              disabled={!selectedPassageId}
              className="rounded-lg bg-[#5D5DFB] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Select Passage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}