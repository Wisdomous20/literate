"use client";

import React from "react";
import { AssessmentHeader } from "./assessmentHeader";

type Assessment = {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear: string;
  // Add any other fields you need for navigation
};

interface AssessmentReportProps {
  studentName: string;
  studentGrade: string;
  assessmentTypeLabel: string;
  assessments: Assessment[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (assessment: Assessment) => void;
    onBack: () => void; // <-- Add this line

}

const recordsPerPage = 7;

export function AssessmentReport({
  studentName,
  studentGrade,
  assessmentTypeLabel,
  assessments,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  onBack,
}: AssessmentReportProps) {
  const paginatedAssessments = assessments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div>
     <AssessmentHeader title="Assessment Report" />
<button
  onClick={onBack}
  className="flex items-center gap-2 text-lg font-semibold text-[#31318A] hover:opacity-80 mb-2 px-8 pt-6"
>
  ← Previous
</button>
      <div className="flex flex-col gap-2 px-8 pt-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#00306E]">{studentName}</h2>
            <span className="text-sm text-[#162DB0] font-medium">
              {studentGrade}
            </span>
          </div>
          <div className="ml-8">
            <span className="text-sm font-semibold text-[#00306E]">
              Assessment Type:
            </span>{" "}
            <span className="text-base font-bold text-[#162DB0]">
              {assessmentTypeLabel}
            </span>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-5 px-8 py-4">
        <div className="flex-1 overflow-hidden rounded-[10px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)] mt-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b">
            <span className="text-[15px] font-semibold text-[#00306E] text-center">
              Attempt
            </span>
            <span className="text-[15px] font-semibold text-[#00306E] text-center">
              Assessment Type
            </span>
            <span className="text-[15px] font-semibold text-[#00306E] text-center">
              Test Type
            </span>
            <span className="text-[15px] font-semibold text-[#00306E] text-center">
              Assessment Date
            </span>
          </div>
          {/* Table Body */}
          <div className="divide-y divide-[rgba(74,74,252,0.08)]">
            {loading ? (
              <div className="px-6 py-8 text-center text-[#00306E]/60">
                Loading...
              </div>
            ) : paginatedAssessments.length === 0 ? (
              <div className="px-6 py-8 text-center text-[#00306E]/60">
                No assessments found
              </div>
            ) : (
              paginatedAssessments.map((record, index) => (
                <div
                  key={`${record.attempt}-${index}`}
                  className="grid grid-cols-4 items-center px-6 py-4 bg-white/10 hover:bg-[#d0e8ff] transition-all duration-200 cursor-pointer"
                  onClick={() => onRowClick(record)}
                >
                  <span className="text-center text-[#00306E] font-medium">
                    {record.attempt}
                  </span>
                  <span className="text-center text-[#00306E]">
                    {record.assessmentType}
                  </span>
                  <span className="text-center font-semibold text-[#162DB0]">
                    {record.testType}
                  </span>
                  <span className="text-center text-[#00306E]">
                    {record.assessmentDate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-2 flex items-center justify-between pb-4">
            <span className="text-sm text-[#00306E]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to first page"
                title="Go to first page"
              >
                {"<<"}
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to previous page"
                title="Go to previous page"
              >
                {"<"}
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to next page"
                title="Go to next page"
              >
                {">"}
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to last page"
                title="Go to last page"
              >
                {">>"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}