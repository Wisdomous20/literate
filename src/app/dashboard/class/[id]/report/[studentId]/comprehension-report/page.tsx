"use client";

import { useSearchParams } from "next/navigation";
import ComprehensionReportHeader from "@/components/reports/oral-reading-test/comprehension-report/reportHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import ComprehensionMetricCards from "@/components/reports/oral-reading-test/comprehension-report/comprehensionMetricCards";
import ComprehensionBreakdownReport from "@/components/reports/oral-reading-test/comprehension-report/comprehensionBreakdownReport";

export default function ReadingComprehensionReportPage() {
  const searchParams = useSearchParams();
  // const attempt = searchParams.get("attempt");
  const testType = searchParams.get("testType");
  // const schoolYear = searchParams.get("schoolYear");

  return (
    <div className="min-h-screen bg-[#f0f4ff] p-4 sm:p-6 lg:p-8">
      <ComprehensionReportHeader />

      {/* Top Row: Student Info (left) + Metric Cards (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mt-4">
        {/* Left: Student Info */}
        <div className="min-w-0">
          <StudentInfoCard studentName="Lois Alonsagay" gradeLevel="Grade 5" />
        </div>
        {/* Right: Percentage + Comprehension Level side by side */}
        <div className="min-w-0">
          <ComprehensionMetricCards
            percentageGrade={80}
            comprehensionLevel="Independent"
          />
        </div>
      </div>

      {/* Bottom Row: Passage Info (left) + Comprehension Breakdown (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left: Passage Info */}
        <div className="min-w-0">
          <PassageInfoCard
            passageTitle="The Whispering of Winds"
            passageLevel="Grade 3"
            numberOfWords={200}
            testType={testType || "Pre-Test"}
            assessmentType="Oral Reading Test"
            // attempt={attempt}
            // schoolYear={schoolYear}
          />
        </div>
        {/* Right: Comprehension Breakdown */}
        <div className="min-w-0">
          <ComprehensionBreakdownReport
            score="8"
            literal={60}
            inferential={60}
            critical={60}
            mistakes={60}
            numberOfItems={200}
            classificationLevel="Independent"
          />
        </div>
      </div>
    </div>
  );
}
