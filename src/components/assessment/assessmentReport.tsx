"use client";

import React, { useState } from "react";
import { ChevronLeft, User } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

type Assessment = {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear: string;
  id: string;
  type: string;
};

type TestTypeFilter = "All" | "Pre-Test" | "Post-Test";

interface AssessmentReportProps {
  studentName: string;
  studentGrade: string;
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

  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      <DashboardHeader title="Assessment Report" />

      <main className="flex flex-col gap-4 px-6 py-5 lg:px-8">
        <button
          onClick={onBack}
          className="flex w-fit items-center gap-1.5 text-base font-semibold text-[#31318A] transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex flex-col gap-3 rounded-2xl border border-[#6666FF]/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF]">
              <User className="h-5 w-5 text-[#6666FF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#00306E]">
                {studentName}
              </h2>
              <span className="text-xs font-medium text-[#162DB0]">
                {studentGrade}
              </span>
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

        <div className="overflow-hidden rounded-2xl border border-[#6666FF]/10 bg-white shadow-sm">
          <div className="grid grid-cols-4 border-b border-[#6666FF]/8 bg-[#F8F9FF] px-5 py-3">
            <span className="text-center text-xs font-semibold text-[#00306E]">
              Attempt
            </span>
            <span className="text-center text-xs font-semibold text-[#00306E]">
              Assessment Type
            </span>
            <span className="text-center text-xs font-semibold text-[#00306E]">
              Test Type
            </span>
            <span className="text-center text-xs font-semibold text-[#00306E]">
              Date
            </span>
          </div>

          <div className="divide-y divide-[#6666FF]/5">
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
                  key={`${record.attempt}-${index}`}
                  className="grid cursor-pointer grid-cols-4 items-center bg-white px-5 py-3 transition-colors hover:bg-[#FAFAFF]"
                  onClick={() => onRowClick(record)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onRowClick(record);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="text-center text-sm font-semibold text-[#6666FF]">
                    #{record.attempt}
                  </span>
                  <span className="text-center text-xs text-[#00306E]">
                    {record.assessmentType}
                  </span>
                  <span className="text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        record.testType === "Post-Test"
                          ? "bg-[#6666FF]/10 text-[#6666FF]"
                          : "bg-[#00306E]/10 text-[#00306E]"
                      }`}
                    >
                      {record.testType}
                    </span>
                  </span>
                  <span className="text-center text-xs text-[#00306E]/70">
                    {record.assessmentDate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#00306E]/60">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-xs text-[#162DB0] hover:bg-[#E4F4FF] disabled:opacity-30"
                aria-label="First page"
                title="First page"
              >
                «
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-xs text-[#162DB0] hover:bg-[#E4F4FF] disabled:opacity-30"
                aria-label="Previous page"
                title="Previous page"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-xs text-[#162DB0] hover:bg-[#E4F4FF] disabled:opacity-30"
                aria-label="Next page"
                title="Next page"
              >
                ›
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#162DB0]/20 text-xs text-[#162DB0] hover:bg-[#E4F4FF] disabled:opacity-30"
                aria-label="Last page"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}