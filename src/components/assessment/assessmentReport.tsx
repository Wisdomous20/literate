"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

const PASTEL_BG = "#E0E7FF"; // Pastel version of #6666FF

type Assessment = {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear: string;
  id: string;
  type: string;
  studentClass?: string;
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

const RECORDS_PER_PAGE = 7;

export function AssessmentReport({
  studentName,
  studentGrade,
  studentClass,
  assessmentTypeLabel,
  assessments,
  loading,
  onRowClick,
  onBack,
}: AssessmentReportProps) {
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>("All");
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const testDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        testDropdownRef.current &&
        !testDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTestDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAssessments =
    testTypeFilter === "All"
      ? assessments
      : assessments.filter((a) => a.testType === testTypeFilter);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / RECORDS_PER_PAGE),
  );

  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DashboardHeader title="Assessment Report" />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 lg:px-8">
        {/* Main Container */}
        <div className="rounded-2xl bg-white p-0 overflow-hidden flex flex-col border border-[#E5E7EB] h-full">
          {/* Pastel Header Section */}
          <div
            className="p-4"
            style={{
              background: PASTEL_BG,
            }}
          >
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={onBack}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white hover:bg-[#9333EA] transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {/* Student Info */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-black uppercase tracking-widest">
                    {studentGrade}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium text-black"
                    style={{ background: PASTEL_BG }}
                  >
                    {assessmentTypeLabel}
                  </span>
                </div>
                <h1 className="text-base font-bold text-black leading-tight">
                  {studentName}
                </h1>
              </div>
              {/* Test Type Dropdown */}
              <div className="ml-auto relative" ref={testDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTestDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-full border border-[#6666FF]/30 bg-white px-4 py-1 text-[11px] font-semibold text-[#6666FF] transition-all hover:border-[#6666FF]/60 hover:bg-[#F8F9FF] shadow-sm"
                  aria-haspopup="listbox"
                  aria-expanded={isTestDropdownOpen}
                  aria-label="Select test type"
                >
                  <span className="truncate">{testTypeFilter}</span>
                  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isTestDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isTestDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-full min-w-24 rounded-lg border border-[#6666FF]/30 bg-white py-1 shadow-lg">
                    {testTypeOptions.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setTestTypeFilter(type.value);
                          setIsTestDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-[#E0E7FF] ${
                          testTypeFilter === type.value
                            ? "font-semibold text-[#6666FF] bg-[#E0E7FF]"
                            : "text-black"
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

          {/* Space between header and table */}
          <div className="h-4" />

          {/* Table Section */}
          <div className="flex-1 flex flex-col overflow-x-auto">
            <div className="min-w-[600px] w-full flex flex-col h-full">
              {/* Table Header */}
              <div
                className="grid grid-cols-4 gap-0 px-4 py-2 rounded-t-lg w-full"
                style={{ background: PASTEL_BG }}
              >
                <div className="text-center">
                  <span className="text-[12px] font-semibold text-black uppercase tracking-wider">
                    Attempts
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[12px] font-semibold text-black uppercase tracking-wider">
                    Assessment Type
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[12px] font-semibold text-black uppercase tracking-wider">
                    Test Type
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[12px] font-semibold text-black uppercase tracking-wider">
                    Assessment Date
                  </span>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 min-h-[200px]">
                {loading ? (
                  <div className="py-8 text-center text-xs text-black/50">
                    Loading…
                  </div>
                ) : paginatedAssessments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-black/50">
                    No assessments found
                  </div>
                ) : (
                  paginatedAssessments.map((record, index) => (
                    <div
                      key={`${record.id}-${index}`}
                      className={`grid grid-cols-4 gap-0 items-center px-4 py-2 cursor-pointer transition-all hover:bg-[#F8F9FF] text-[13px] w-full ${
                        index !== paginatedAssessments.length - 1
                          ? "border-b border-[#E5E7EB]"
                          : ""
                      }`}
                      onClick={() => onRowClick(record)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onRowClick(record);
                      }}
                    >
                      <span className="font-medium text-black text-center">
                        {record.attempt}
                      </span>
                      <span className="font-medium text-black text-center">
                        {record.assessmentType}
                      </span>
                      <span className="font-medium text-black text-center">
                        {record.testType}
                      </span>
                      <span className="font-medium text-black text-center">
                        {record.assessmentDate}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-white px-4 py-3">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center rounded-lg border border-[#6666FF]/25 bg-white px-2 py-1 text-[11px] font-bold text-[#6666FF] transition-all hover:enabled:bg-[#F8F9FF] hover:enabled:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-black">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`h-6 w-6 rounded-full text-[11px] font-bold transition-all flex items-center justify-center ${
                          currentPage === i + 1
                            ? "bg-[#A855F7] text-white shadow"
                            : "bg-white border border-[#6666FF]/25 text-[#6666FF] hover:bg-[#F8F9FF] hover:border-[#6666FF]/40"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center rounded-lg border border-[#6666FF]/25 bg-white px-2 py-1 text-[11px] font-bold text-[#6666FF] transition-all hover:enabled:bg-[#F8F9FF] hover:enabled:border-[#6666FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}g