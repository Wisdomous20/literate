// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { AssessmentReport } from "@/components/assessment/assessmentReport";
// import { getStudentAction } from "@/app/actions/student/getStudentById";
// import { getAssessmentsByStudent } from "@/app/actions/assessment/getAssessment";

// // Utility to convert level to grade string
// function levelToGradeLevel(level?: number): string {
//   if (!level) return "Grade 1";
//   return `Grade ${level}`;
// }

// // Map DB type to user-friendly label
// const assessmentTypeLabels: Record<string, string> = {
//   ORAL_READING: "Oral Reading Test",
//   COMPREHENSION: "Reading Comprehension Test",
//   READING_FLUENCY: "Reading Fluency Test",
// };

// // Get current school year (e.g., "2025-2026" for March 2026)
// function getCurrentSchoolYear(): string {
//   const now = new Date();
//   const year = now.getFullYear();
//   // School year starts in June, ends in March next year
//   if (now.getMonth() + 1 >= 6) {
//     // June or later: current year - next year
//     return `${year}-${year + 1}`;
//   } else {
//     // Before June: previous year - current year
//     return `${year - 1}-${year}`;
//   }
// }

// // Helper to extract student object regardless of shape
// function extractStudent(result: any) {
//   if (result && typeof result === "object" && "data" in result) {
//     return result.data;
//   }
//   return result;
// }

// export default function AssessmentReportPage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const studentId = params.studentId as string;

//   // Get assessment type from query param (e.g., ?assessmentType=READING_FLUENCY)
//   const assessmentTypeParam = searchParams.get("assessmentType");
//   const assessmentTypeLabel = assessmentTypeParam
//     ? assessmentTypeLabels[assessmentTypeParam] || assessmentTypeParam
//     : "Unknown Assessment Type";

//   const [studentName, setStudentName] = useState("");
//   const [studentGrade, setStudentGrade] = useState("");
//   const [assessments, setAssessments] = useState<any[]>([]);

//   // Filters
//   const [schoolYear, setSchoolYear] = useState<string>("");
//   const [testType, setTestType] = useState<string>("");

//   // School year options
//   const [schoolYearOptions, setSchoolYearOptions] = useState<string[]>([]);

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const recordsPerPage = 7;

//   useEffect(() => {
//     if (!assessmentTypeParam) return;

//     async function fetchData() {
//       // Fetch student info
//       const studentResult = await getStudentAction(studentId);
//       const student = extractStudent(studentResult);
//       setStudentName(student?.name || "No Name");
//       setStudentGrade(levelToGradeLevel(student?.level));

//       // Fetch all assessments for this student
//       const allAssessments = await getAssessmentsByStudent(studentId);

//       // Debug: log all assessments and the filter param
//       console.log("allAssessments", allAssessments);
//       console.log("assessmentTypeParam", assessmentTypeParam);

//       // Filter by assessment type (raw type, not label)
//       const filtered = (allAssessments || [])
//         .filter((a: any) => a.type === assessmentTypeParam)
//         .map((a: any, idx: number) => ({
//           attempt: idx + 1,
//           assessmentType: assessmentTypeLabels[a.type] || a.type,
//           testType: a.testType || "Pre-Test",
//           assessmentDate: a.dateTaken
//             ? new Date(a.dateTaken).toLocaleDateString()
//             : "",
//           schoolYear: a.schoolYear || "",
//         }));

//       setAssessments(filtered);

//       // School year options: always include current year at the top
//       const years = Array.from(new Set(filtered.map((a) => a.schoolYear))).filter(Boolean);
//       const currentSY = getCurrentSchoolYear();
//       if (!years.includes(currentSY)) {
//         years.unshift(currentSY);
//       }
//       setSchoolYearOptions(years);

//       // Set default school year to current
//       setSchoolYear(currentSY);
//       setTestType(""); // Show all by default
//     }
//     fetchData();
//   }, [studentId, assessmentTypeParam]);

//   // Filtered and paginated assessments
//   const filteredAssessments = assessments.filter(
//     (a) =>
//       (schoolYear ? a.schoolYear === schoolYear : true) &&
//       (testType ? a.testType === testType : true)
//   );
//   const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / recordsPerPage));
//   const paginatedAssessments = filteredAssessments.slice(
//     (currentPage - 1) * recordsPerPage,
//     currentPage * recordsPerPage
//   );

//   return (
//     <AssessmentReport
//       studentName={studentName}
//       studentGrade={studentGrade}
//       schoolYear={schoolYear}
//       testType={testType}
//       assessmentType={assessmentTypeLabel}
//       onSchoolYearChange={setSchoolYear}
//       onTestTypeChange={setTestType}
//       assessments={paginatedAssessments}
//       currentPage={currentPage}
//       totalPages={totalPages}
//       onPageChange={setCurrentPage}
//       onBack={() => router.back()}
//       schoolYearOptions={schoolYearOptions}
//     />
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getStudentAction } from "@/app/actions/student/getStudentById";
import { getAssessmentsByStudent } from "@/app/actions/assessment/getAssessment";

// Utility to convert level to grade string
function levelToGradeLevel(level?: number): string {
  if (!level) return "Grade 1";
  return `Grade ${level}`;
}

// Map DB type to user-friendly label
const assessmentTypeLabels: Record<string, string> = {
  ORAL_READING: "Oral Reading Test",
  COMPREHENSION: "Reading Comprehension Test",
  READING_FLUENCY: "Reading Fluency Test",
};

export default function AssessmentReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = params.studentId as string;

  // Get assessment type from query param (e.g., ?assessmentType=READING_FLUENCY)
  const assessmentTypeParam = searchParams.get("assessmentType");
  const assessmentTypeLabel = assessmentTypeParam
    ? assessmentTypeLabels[assessmentTypeParam] || assessmentTypeParam
    : "Unknown Assessment Type";

  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 7;

  useEffect(() => {
    if (!assessmentTypeParam) {
      setLoading(false);
      setAssessments([]);
      return;
    }
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch student info
        const studentResult = await getStudentAction(studentId);
        const student = studentResult?.data || studentResult;
        setStudentName(student?.name || "");
        setStudentGrade(levelToGradeLevel(student?.level));

        // Fetch all assessments for this student
        const allAssessments = await getAssessmentsByStudent(studentId);

        // Filter by assessment type
        const filtered = (allAssessments || [])
          .filter((a: any) => a.type === assessmentTypeParam)
          .map((a: any, idx: number) => ({
            attempt: idx + 1,
            assessmentType: assessmentTypeLabels[a.type] || a.type,
            testType: a.testType || "Pre-Test",
            assessmentDate: a.dateTaken
              ? new Date(a.dateTaken).toLocaleDateString()
              : "",
            schoolYear: a.schoolYear || "",
          }));

        setAssessments(filtered);
      } catch (e) {
        setStudentName("Unknown");
        setStudentGrade("");
        setAssessments([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [studentId, assessmentTypeParam]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(assessments.length / recordsPerPage));
  const paginatedAssessments = assessments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div>
      <div className="flex flex-col gap-2 px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-lg font-semibold text-[#31318A] hover:opacity-80 mb-2"
        >
          ← Previous
        </button>
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
                  className="grid grid-cols-4 items-center px-6 py-4 bg-white/10 hover:bg-[#d0e8ff] transition-all duration-200"
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
                onClick={() => setCurrentPage(1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to first page"
                title="Go to first page"
              >
                {"<<"}
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to previous page"
                title="Go to previous page"
              >
                {"<"}
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded border border-[#162DB0]/30 text-[#162DB0] disabled:opacity-30 hover:bg-[#E4F4FF]"
                aria-label="Go to next page"
                title="Go to next page"
              >
                {">"}
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
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