"use client";

import { useSearchParams } from "next/navigation";
import ReportHeader from "@/components/reports/oral-reading-test/reading-fluency-report/reportHeader";
import StudentInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/studentInfoCard";
import PassageInfoCard from "@/components/reports/oral-reading-test/reading-fluency-report/passageInfoCard";
import MetricCards from "@/components/reports/oral-reading-test/reading-fluency-report/metricCards";
import MiscueAnalysisReport from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";
import AudioPlaybackCard from "@/components/reports/oral-reading-test/reading-fluency-report/audioPlaybackCard";
import BehaviorChecklist from "@/components/reports/oral-reading-test/reading-fluency-report/readingBehaviorChecklist";
import type { MiscueData } from "@/components/reports/oral-reading-test/reading-fluency-report/miscueAnalysis";

export default function ReadingFluencyReportPage() {
  const searchParams = useSearchParams();
  const attempt = searchParams.get("attempt");
  const testType = searchParams.get("testType");
  const schoolYear = searchParams.get("schoolYear");

  // Use all extracted params to avoid unused variable warnings
  console.log("Report params:", { attempt, testType, schoolYear });

  const miscueData: MiscueData = {
    mispronunciation: 60,
    omission: 60,
    substitution: 60,
    transposition: 60,
    reversal: 60,
    insertion: 60,
    repetition: 60,
    selfCorrection: 60,
    totalMiscue: 60,
    oralFluencyScore: "90%",
    classificationLevel: "Independent",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header with Previous, Export, Delete */}
      <ReportHeader />

      {/* Row 1: Student Info (left) + 3 Metric Cards (right) */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        {/* Student Info Card - spans left column */}
        <StudentInfoCard studentName="Lois Alonsagay" gradeLevel="Grade 5" />

        {/* Metric Cards row - spans right column */}
        <MetricCards
          wcpm={142}
          readingTime="88"
          classificationLevel="Independent"
        />
      </div>

      {/* Row 2: 3-column layout — Passage+Audio | Behavior Checklist | Miscue Analysis */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Left Column: Passage Info + Audio Playback stacked */}
        <div className="flex flex-col gap-4">
          <PassageInfoCard
            passageTitle="The Whispering of Winds"
            passageLevel="Grade 3"
            numberOfWords={200}
            testType={testType || "Pre-Test"}
            assessmentType="Oral Reading Test"
          />
          <AudioPlaybackCard />
        </div>

        {/* Middle Column: Oral Behavior Checklist */}
        <div className="flex flex-col">
          <BehaviorChecklist
            behaviors={[
              {
                label: "Does word-by-word reading",
                description: "Nagbabasa nang pa-isa isang salita",
                checked: false,
              },
              {
                label: "Lacks expression: reads in a monotonous tone",
                description:
                  "Walang damdamin; walang pagbabago ang tono",
                checked: false,
              },
              {
                label: "Disregards Punctuation",
                description: "Hindi pinapansin ang mga bantas",
                checked: false,
              },
              {
                label: "Employs little or no method of analysis",
                description:
                  "Bahagya o walang paraan ng pagsusuri",
                checked: false,
              },
            ]}
          />
        </div>

        {/* Right Column: Miscue Analysis Report */}
        <div className="flex flex-col">
          <MiscueAnalysisReport miscueData={miscueData} />
        </div>
      </div>
    </div>
  );
}