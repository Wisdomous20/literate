"use client";

import { ChevronLeft, FileText, RotateCcw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import { NavButton } from "@/components/ui/navButton";
import Image from "next/image";

interface AssessmentCard {
  id: string;
  title: string;
  percentage: number;
  level: string;
}

interface OralReadingLevel {
  level: string;
  label: string;
}

interface AssessmentSummaryProps {
  studentName: string;
  studentGrade: string;
  assessmentTypeLabel: string;
  oralReadingLevel: OralReadingLevel;
  assessmentCards: AssessmentCard[];
  onViewReport: (cardId: string) => void;
  onExportPdf: () => void;
  onStartNew?: () => void;
  onBack: () => void;
}

function getLevelColor(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "text-emerald-600";
    case "instructional":
      return "text-blue-600";
    case "frustration":
      return "text-red-500";
    default:
      return "text-[#00306E]";
  }
}

function getLevelBgColor(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "bg-emerald-50 border-emerald-200";
    case "instructional":
      return "bg-blue-50 border-blue-200";
    case "frustration":
      return "bg-red-50 border-red-200";
    default:
      return "bg-[#FFF0EF] border-red-200";
  }
}

function getProgressBarColor(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "bg-emerald-400";
    case "instructional":
      return "bg-blue-400";
    case "frustration":
      return "bg-red-400";
    default:
      return "bg-emerald-400";
  }
}

function getClassificationSubtext(level: string): string {
  switch (level?.toLowerCase()) {
    case "independent":
      return "Student demonstrates strong reading ability across all areas.";
    case "instructional":
      return "Student is on track with appropriate instructional support.";
    case "frustration":
      return "Student requires intensive support to improve reading skills.";
    default:
      return "Student demonstrates strong reading ability across all areas.";
  }
}

export function AssessmentSummary({
  studentName,
  studentGrade,
  assessmentTypeLabel,
  oralReadingLevel,
  assessmentCards,
  onViewReport,
  onExportPdf,
  onStartNew,
  onBack,
}: AssessmentSummaryProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DashboardHeader title="Assessment Summary" />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 lg:px-8">
        {/* Main White Container */}
        <div className="rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] h-full flex flex-col">
          {/* Pastel Header Section */}
          <div
            className="px-6 py-4 bg-[#E0E7FF]"
          >
            <div className="flex items-center justify-between">
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
                      style={{ background: "#E0E7FF" }}
                    >
                      {assessmentTypeLabel}
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-black leading-tight">
                    {studentName}
                  </h1>
                </div>
              </div>
              {/* Export PDF Button */}
              <button
                onClick={onExportPdf}
                className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Export to PDF
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Reading Level Section */}
            {oralReadingLevel.level && (
              <div className="relative rounded-2xl overflow-hidden mb-6 h-48">
                {/* Background Image */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "url('/images/Class-bg.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#6666FF]/90 to-[#6666FF]/75" />

                {/* Content */}
                <div className="relative h-full flex items-center justify-between px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-white" />
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">
                        Reading Level
                      </span>
                    </div>
                    <span className="text-xs text-white/80">
                      Based on all assessments
                    </span>
                    <h2 className="text-4xl font-extrabold text-white mt-2">
                      {oralReadingLevel.level}
                    </h2>
                    <p className="text-sm text-white/90 mt-2 max-w-sm">
                      {getClassificationSubtext(oralReadingLevel.level)}
                    </p>
                  </div>

                  {/* Bee Illustration - slightly out of container */}
                  <div className="relative -mr-8">
                    <Image
                      src="/images/Class.png"
                      alt="Student mascot"
                      width={200}
                      height={200}
                      className="h-auto w-auto"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#E5E7EB] my-6" />

            {/* Assessment Cards Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {assessmentCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-xl overflow-hidden border-l-2 border-t-2 border-r-4 border-b-4"
                  style={{
                    borderLeftColor: "#E5E7EB",
                    borderTopColor: "#E5E7EB",
                    borderRightColor: "#2E2E68",
                    borderBottomColor: "#2E2E68",
                  }}
                >
                  <div className="bg-white p-6 flex flex-col h-full">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-col">
                        <h3 className="text-base font-bold text-[#00306E]">
                          {card.title === "Oral Reading Fluency Test"
                            ? "Oral Fluency Test Report"
                            : card.title === "Reading Comprehension Test"
                            ? "Reading Comprehension Test Report"
                            : card.title}
                        </h3>
                        <span className="text-xs text-[#00306E]/60 mt-1">
                          Based on all assessments
                        </span>
                      </div>
                      <button
                        onClick={() => onViewReport(card.id)}
                        className="rounded-full bg-[#A855F7] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#9333EA] transition whitespace-nowrap"
                        type="button"
                        aria-label={`View ${card.title} report`}
                      >
                        View Report
                      </button>
                    </div>

                    {/* Classification */}
                    <div className="mb-4">
                      <span
                        className={`text-lg font-bold ${getLevelColor(card.level)}`}
                      >
                        {card.level}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressBarColor(card.level)} transition-all`}
                            style={{ width: `${Math.round(card.percentage)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-extrabold text-[#00306E]">
                          {Math.round(card.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AssessmentSummary;