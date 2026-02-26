"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssessmentReport } from "@/components/assessment/assessmentReport";

// 🔥 MOCK DATA — Replace with real API calls later
const mockAssessments = Array.from({ length: 36 }, (_, i) => ({
  attempt: i + 1,
  assessmentType:
    i % 3 === 0
      ? "Reading Fluency Test"
      : i % 3 === 1
        ? "Reading Comprehension Test"
        : "Oral Reading Test",
  testType: "Pre-Test",
  assessmentDate: "1/10/2025",
  schoolYear: i % 2 === 0 ? "2026-2027" : "2025-2026",
}));

export default function AssessmentReportPage() {
  const params = useParams();
  const router = useRouter();

  // State for filters and pagination
  const [schoolYear, setSchoolYear] = useState("2026-2027");
  const [testType, setTestType] = useState("Pre-Test");
  const [assessmentType, setAssessmentType] = useState("Oral Reading Test");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and paginate data
  const filteredAssessments = mockAssessments.filter(
    (a) =>
      a.assessmentType === assessmentType &&
      a.testType === testType &&
      a.schoolYear === schoolYear,
  );
  const recordsPerPage = 7;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / recordsPerPage),
  );
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage,
  );

  // Mock student info (replace with real data as needed)
  const studentName = "Lois Alonsagay";
  const studentGrade = "Grade 5";

  // Navigation logic based on assessment type
  const handleAttemptClick = (attempt: number, assessmentType: string) => {
    const basePath = `/dashboard/class/${params.id}/report/${params.studentId}`;
    const query = `?attempt=${attempt}&testType=${testType}&schoolYear=${schoolYear}`;
    if (assessmentType === "Oral Reading Test") {
      router.push(`${basePath}/summary${query}`);
    } else if (assessmentType === "Reading Fluency Test") {
      router.push(`${basePath}/reading-fluency-report${query}`);
    } else if (assessmentType === "Comprehension Test") {
      router.push(`${basePath}/comprehension-report${query}`);
    }
  };

  return (
    <div>
      <AssessmentReport
        studentName={studentName}
        studentGrade={studentGrade}
        schoolYear={schoolYear}
        testType={testType}
        assessmentType={assessmentType}
        onSchoolYearChange={setSchoolYear}
        onTestTypeChange={setTestType}
        onAssessmentTypeChange={setAssessmentType}
        assessments={paginatedAssessments}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onBack={() => router.back()}
      />
      <div className="mt-6">
        {" "}
        <h3>Attempts</h3>
        {paginatedAssessments.length === 0 && <div>No attempts found.</div>}
        {paginatedAssessments.map((assessment) => (
          <button
            key={assessment.attempt}
            type="button"
            className="block my-2"
            onClick={() =>
              handleAttemptClick(assessment.attempt, assessment.assessmentType)
            }
          >
            Attempt {assessment.attempt} - {assessment.assessmentType} -{" "}
            {assessment.schoolYear}
          </button>
        ))}
      </div>
    </div>
  );
}
