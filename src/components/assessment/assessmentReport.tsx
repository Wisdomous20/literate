
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
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
};

type TestTypeFilter = "All" | "Pre-Test" | "Post-Test";

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
  assessmentTypeLabel,
  assessments,
  loading,
  onRowClick,
  onBack,
}: AssessmentReportProps) {
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);

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

  const testTypeOptions: TestTypeFilter[] = ["All", "Pre-Test", "Post-Test"];

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DashboardHeader title="Assessment Report" />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 lg:px-8">
        <button
          onClick={onBack}
          className="flex w-fit items-center gap-1.5 text-base font-semibold text-[#31318A] transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex flex-col gap-3 rounded-2xl border border-[#6666FF] bg-[#6666FF]/10 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF]">
              <User className="h-5 w-5 text-[#6666FF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#00306E]">
                {studentName}
              </h2>
              <div className="flex gap-2">
                <span className="text-xs font-medium text-[#162DB0]">
                  {studentGrade}
                </span>
                {studentClass && (
                  <span className="text-xs font-medium text-[#162DB0]">
                    • {studentClass}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-2 hidden sm:block">
              <span className="rounded-full border border-[#6666FF]/25 bg-[#EEF0FF] px-3 py-1 text-xs font-semibold text-[#6666FF]">
                {assessmentTypeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#00306E]/60">Filter:</span>
            {testTypeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setTestTypeFilter(opt);
                  setCurrentPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  testTypeFilter === opt
                    ? "border-[#6666FF] bg-[#6666FF] text-white shadow-sm"
                    : "border-dashed border-[#6666FF]/60 bg-transparent text-[#00306E] hover:border-[#6666FF] hover:bg-[#EEEEFF]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

<div className="overflow-hidden min-h-125 rounded-2xl border border-[#6666FF]/10 bg-white shadow-xl">
          <div className="grid grid-cols-4 border-b border-[#6666FF]/15 bg-linear-to-r from-[#8585faed] to-[#b8c2f7] px-5 py-3">
            <span className="text-center text-xs font-bold text-white">
              Attempt
            </span>
            <span className="text-center text-xs font-bold text-white">
              Assessment Type
            </span>
            <span className="text-center text-xs font-bold text-white">
              Test Type
            </span>
            <span className="text-center text-xs font-bold text-white">
              Date
            </span>
          </div>
          <div className="max-h-[50vh] divide-y divide-[#6666FF]/5 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-[#00306E]/50">
                Loading…
              </div>
            ) : paginatedAssessments.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#00306E]/50">
                No assessments found
              </div>
            ) : (
              paginatedAssessments.map((record, index) => (
                <div
                  key={`${record.id}-${index}`}
                  className={`grid grid-cols-4 items-center px-5 py-3 cursor-pointer transition-all ${
                    index % 2 === 0
                      ? "bg-white hover:bg-[#F5F5FF]"
                      : "bg-[#E8ECFF]/40 hover:bg-[#E8ECFF]/80"
                  }`}
                  onClick={() => onRowClick(record)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onRowClick(record);
                  }}
                >
                  <span className="text-center text-sm font-semibold text-[#00306E]">
                    {record.attempt}
                  </span>
                  <span className="text-center text-sm text-[#5d5db6]">
                    {record.assessmentType}
                  </span>
                  <span className="text-center text-sm text-[#5d5db6]">
                    {record.testType}
                  </span>
                  <span className="text-center text-sm text-[#5d5db6]">
                    {record.assessmentDate}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#6666FF]/10 bg-[#F8F9FF]/40 px-5 py-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-semibold text-[#6666FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[#F8F9FF]"
                type="button"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs font-medium text-[#00306E]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#6666FF]/25 bg-white px-3 py-2 text-xs font-semibold text-[#6666FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[#F8F9FF]"
                type="button"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
