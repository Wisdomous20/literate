"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

type Assessment = {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear: string;
  id: string;
  type: string;
  studentClass?: string;
  language?: string;
};

type TestTypeFilter = "All" | "Pre-Test" | "Post-Test";

const testTypeOptions: { label: string; value: TestTypeFilter }[] = [
  { label: "All", value: "All" },
  { label: "Pre-Test", value: "Pre-Test" },
  { label: "Post-Test", value: "Post-Test" },
];

interface AssessmentReportProps {
  studentName: string;
  studentGrade: string;
  studentClass?: string;
  assessmentTypeLabel: string;
  assessments: Assessment[];
  loading: boolean;
  onRowClick: (assessment: Assessment) => void;
  onBack: () => void;
}

const RECORDS_PER_PAGE = 8;

export function AssessmentReport({
  studentName,
  studentGrade,
  studentClass,
  assessments,
  loading,
  onRowClick,
  onBack,
}: AssessmentReportProps) {
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>("All");
  const [languageFilter, setLanguageFilter] = useState<string>("All");
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clickedRow, setClickedRow] = useState<string | null>(null);

  const testDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages = ["All", "Filipino", "English"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        testDropdownRef.current &&
        !testDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTestDropdownOpen(false);
      }
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    const testMatch =
      testTypeFilter === "All" || a.testType === testTypeFilter;
    const langMatch =
      languageFilter === "All" || (a.language ?? "English") === languageFilter;
    return testMatch && langMatch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / RECORDS_PER_PAGE),
  );

  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  const handleRowClick = (record: Assessment) => {
    setClickedRow(record.id);
    setTimeout(() => setClickedRow(null), 300);
    onRowClick(record);
  };

  const columns = [
    "Attempts",
    "Assessment ID",
    "Assessment Type",
    "Test Type",
    "Language",
    "Assessment Date",
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DashboardHeader title="Assessment Report" schoolYear="" />

      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-4 lg:px-8">
        <div
          className="rounded-2xl bg-white overflow-hidden flex flex-col flex-1
            border-t border-l border-r-[4px] border-b-[4px] border-[#A855F7] border-r-[#5D5DFB] border-b-[#5D5DFB]"
        >
          {/* Header bar */}
          <div className="px-5 py-4 bg-white border-b border-indigo-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Back button — white filled, same as manage class */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full translate-y-1 bg-[#E0E0FF]" />
                  <button
                    type="button"
                    onClick={onBack}
                    className="relative flex items-center gap-1.5 rounded-full border border-[#6666FF]/40 px-4 py-2 text-xs font-semibold shadow-sm transition-transform bg-white text-[#6666FF] hover:bg-[#F0F4FF] hover:-translate-y-0.5 active:translate-y-0"
                    aria-label="Go back"
                    title="Go back"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    Back
                  </button>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-[#C4B5FD] mx-1" />

                {/* Student info — name first, then grade · class */}
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-base font-bold text-[#3B2F7F] leading-tight">
                    {studentName}
                  </h1>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#5D5DFB] uppercase tracking-widest">
                      {studentGrade}
                    </span>
                    {studentClass && (
                      <>
                        <span className="text-[#C4B5FD] font-bold">·</span>
                        <span className="text-[11px] font-semibold text-[#5D5DFB]">
                          {studentClass}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                {/* Language filter */}
                <div className="relative" ref={langDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsLangDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-[#6666FF]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#6666FF] transition-all hover:border-[#6666FF]/60 hover:bg-[#F8F9FF] shadow-sm"
                    aria-label="Filter by language"
                  >
                    <span>
                      Language:{" "}
                      {languageFilter === "All" ? "All" : languageFilter}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 transition-transform ${isLangDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isLangDropdownOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-xl border border-[#6666FF]/20 bg-white py-1 shadow-lg">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setLanguageFilter(lang);
                            setIsLangDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#DDD6FE] ${
                            languageFilter === lang
                              ? "font-bold text-[#6666FF] bg-[#DDD6FE]"
                              : "text-[#3B2F7F]"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test type filter */}
                <div className="relative" ref={testDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTestDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-[#6666FF]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#6666FF] transition-all hover:border-[#6666FF]/60 hover:bg-[#F8F9FF] shadow-sm"
                    aria-label="Select test type"
                  >
                    <span>
                      {testTypeFilter === "All"
                        ? "Test Type: All"
                        : testTypeFilter}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 transition-transform ${isTestDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isTestDropdownOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-28 rounded-xl border border-[#6666FF]/20 bg-white py-1 shadow-lg">
                      {testTypeOptions.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setTestTypeFilter(type.value);
                            setIsTestDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#DDD6FE] ${
                            testTypeFilter === type.value
                              ? "font-bold text-[#6666FF] bg-[#DDD6FE]"
                              : "text-[#3B2F7F]"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-6 px-4 py-3.5 bg-[#ffffff] border-b-2 border-[#A78BFA]">
              {columns.map((col) => (
                <div key={col} className="text-center">
                  <span className="text-[11px] font-bold text-[#5D5DFB] uppercase tracking-wider">
                    {col}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable rows */}
            <div className="flex-1 overflow-y-auto class-scroll">
              {loading ? (
                <div className="py-8 text-center text-xs text-[#3B2F7F]/50">
                  Loading…
                </div>
              ) : paginatedAssessments.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#3B2F7F]/40">
                  No assessments found
                </div>
              ) : (
                paginatedAssessments.map((record, index) => (
                  <div
                    key={`${record.id}-${index}`}
                    className={`
                      grid grid-cols-6 items-center px-4 py-3.5 cursor-pointer text-[13px] w-full
                      transition-all duration-200 select-none border-b border-[#E8E4FF]
                      ${index % 2 === 1 ? "bg-[#F8F6FF]" : "bg-white"}
                      ${
                        clickedRow === record.id
                          ? "!bg-[#DDD6FE] scale-[1.01] shadow-md -translate-y-0.5"
                          : "hover:!bg-[#EDE9FE] hover:scale-[1.01] hover:shadow-md hover:-translate-y-0.5 active:!bg-[#DDD6FE] active:scale-[0.99]"
                      }
                    `}
                    onClick={() => handleRowClick(record)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleRowClick(record);
                    }}
                  >
                    <span className="font-semibold text-[#5D5DFB] text-center">
                      {record.attempt}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#3B2F7F]/60 text-center truncate px-1">
                      {record.id.slice(0, 8)}…
                    </span>
                    <span className="font-medium text-[#3B2F7F] text-center">
                      {record.assessmentType}
                    </span>
                    <span className="font-medium text-[#3B2F7F] text-center">
                      {record.testType}
                    </span>
                    <span className="font-medium text-[#3B2F7F] text-center capitalize">
                      {record.language ?? "English"}
                    </span>
                    <span className="font-medium text-[#3B2F7F] text-center">
                      {record.assessmentDate}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination — always visible at bottom */}
            <div className="flex items-center justify-center gap-2 border-t border-[#EDE9FE] bg-white px-4 py-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border-2 border-[#6666FF]/25 bg-white px-3 py-1.5 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                      currentPage === i + 1
                        ? "bg-[#6666FF] text-white shadow-[0_4px_12px_rgba(102,102,255,0.3)]"
                        : "bg-white border-2 border-[#6666FF]/25 text-[#6666FF] hover:bg-[#F8F9FF] hover:border-[#6666FF]/40"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border-2 border-[#6666FF]/25 bg-white px-3 py-1.5 text-xs font-bold text-[#6666FF] transition-all hover:bg-[#F8F9FF] hover:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
