import { User, ChevronLeft, ChevronRight } from "lucide-react";
import { AssessmentHeader } from "@/components/assessment/assessmentHeader";
import { useParams, useRouter } from "next/navigation";

interface AssessmentRecord {
  attempt: number;
  assessmentType: string;
  testType: string;
  assessmentDate: string;
  schoolYear?: string;
}

interface AssessmentReportProps {
  studentName: string;
  studentGrade: string;
  schoolYear: string;
  testType: string;
  assessmentType: string;
  onSchoolYearChange: (v: string) => void;
  onTestTypeChange: (v: string) => void;
  assessments: AssessmentRecord[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBack: () => void;
  schoolYearOptions: string[];
}

export function AssessmentReport({
  studentName,
  studentGrade,
  schoolYear,
  testType,
  assessmentType,
  onSchoolYearChange,
  onTestTypeChange,
  assessments,
  currentPage,
  totalPages,
  onPageChange,
  onBack,
  schoolYearOptions,
}: AssessmentReportProps) {
  const params = useParams();
  const router = useRouter();

  // Always include the current school year in the dropdown
  const getSchoolYearOptions = () => {
    const now = new Date();
    const year = now.getFullYear();
    const currentSY =
      now.getMonth() + 1 >= 6
        ? `${year}-${year + 1}`
        : `${year - 1}-${year}`;
    const options = schoolYearOptions.includes(currentSY)
      ? schoolYearOptions
      : [currentSY, ...schoolYearOptions];
    // Remove duplicates just in case
    return Array.from(new Set(options));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Debug log for troubleshooting
  // Remove or comment out in production
  // console.log("Assessments for report:", assessments);

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto">
      <AssessmentHeader title="Assessment Report" />

      <main className="flex flex-1 flex-col gap-5 px-8 py-4">
        {/* Back button + Filters */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-lg font-semibold text-[#31318A] hover:opacity-80"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {/* School Year Filter */}
            <div className="flex flex-col items-center rounded-lg border-2 border-[#162DB0] px-4 py-1.5 bg-white">
              <span className="text-xs font-semibold text-[#162DB0]">
                School Year
              </span>
              <select
                aria-label="Select School Year"
                value={schoolYear}
                onChange={(e) => onSchoolYearChange(e.target.value)}
                className="text-sm font-medium text-[#00306E] bg-transparent outline-none text-center cursor-pointer"
              >
                {getSchoolYearOptions().map((sy) => (
                  <option key={sy} value={sy}>
                    {sy}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Type Filter */}
            <div className="flex flex-col items-center rounded-lg border-2 border-[#162DB0] px-4 py-1.5 bg-white">
              <span className="text-xs font-semibold text-[#162DB0]">
                Test Type
              </span>
              <select
                aria-label="Select Test Type"
                value={testType}
                onChange={(e) => onTestTypeChange(e.target.value)}
                className="text-sm font-medium text-[#00306E] bg-transparent outline-none text-center cursor-pointer"
              >
                <option value="">All</option>
                <option value="Pre-Test">Pre-Test</option>
                <option value="Post-Test">Post-Test</option>
              </select>
            </div>

            {/* Assessment Type (static) */}
            <div className="flex flex-col items-center rounded-lg border-2 border-[#162DB0] px-4 py-1.5 bg-white">
              <span className="text-xs font-semibold text-[#162DB0]">
                Assessment Type
              </span>
              <span className="text-sm font-medium text-[#00306E]">
                {assessmentType}
              </span>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#00306E]">
              {studentName || "No Name"}
            </h2>
            <span className="text-sm text-[#162DB0] font-medium">
              {studentGrade}
            </span>
          </div>
        </div>

        {/* Assessment Table */}
        <div className="flex-1 overflow-hidden rounded-[10px] bg-[#E4F4FF] border border-[rgba(74,74,252,0.08)]">
          {/* Table Header */}
          <div className="grid grid-cols-4 px-6 py-3 bg-[rgba(74,74,252,0.12)] border-b">
            <span className="text-[15px] font-semibold text-[#00306E] text-center">
              Attempts
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
            {assessments.length === 0 ? (
              <div className="px-6 py-8 text-center text-[#00306E]/60">
                No assessments found
              </div>
            ) : (
              assessments.map((record, index) => (
                <div
                  key={`${record.attempt}-${index}`}
                  className="grid grid-cols-4 items-center px-6 py-4 bg-white/10 hover:bg-[#d0e8ff] transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    const classId = params.id as string;
                    const studentId = params.studentId as string;
                    const query = `?attempt=${record.attempt}&testType=${record.testType}&schoolYear=${schoolYear}`;
                    if (record.assessmentType === "Oral Reading Test") {
                      router.push(
                        `/dashboard/class/${classId}/report/${studentId}/summary${query}`,
                      );
                    } else if (
                      record.assessmentType === "Reading Fluency Test"
                    ) {
                      router.push(
                        `/dashboard/class/${classId}/report/${studentId}/reading-fluency-report${query}`,
                      );
                    } else if (
                      record.assessmentType === "Reading Comprehension Test"
                    ) {
                      router.push(
                        `/dashboard/class/${classId}/report/${studentId}/comprehension-report${query}`,
                      );
                    }
                  }}
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
        <div className="mt-2 flex items-center justify-between pb-4">
          <span className="text-sm text-[#00306E]">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            {/* First / Prev */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(1)}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
              aria-label="Go to first page"
              title="Go to first page"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2.5" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, idx) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-[#00306E]">
                  {page}
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium ${
                    currentPage === page
                      ? "bg-[#162DB0] text-white"
                      : "border border-[#162DB0]/30 text-[#162DB0] hover:bg-[#E4F4FF]"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            {/* Last / Next */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
              aria-label="Go to last page"
              title="Go to last page"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}