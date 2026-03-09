"use client";

import { ChevronLeft, FileText } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";

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
  assessmentCards: AssessmentCard[];
  oralReadingLevel: OralReadingLevel;
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

export function AssessmentSummary({
  assessmentCards,
  oralReadingLevel,
  onViewReport,
  onExportPdf,
  onStartNew,
  onBack,
}: AssessmentSummaryProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#E8ECFF]">
      {/* Assessment Header */}
      <DashboardHeader
        title="Assessment Summary"
        action={
          <div className="flex items-center gap-3">
            {onStartNew && (
              <button
                onClick={onStartNew}
                className="rounded-lg bg-[#2E2E68] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Start New
              </button>
            )}
            <button
              onClick={onExportPdf}
              className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              type="button"
            >
              Export to PDF
            </button>
          </div>
        }
      />

      {/* Back button */}
      <div className="flex items-center px-6 pt-4 lg:px-8">
        <button
          onClick={onBack}
className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-[#00306E] transition-opacity hover:underline"        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
      </div>

      <main className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-6 pt-4 lg:px-8">
        {/* Centered, stretched assessment cards */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {assessmentCards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-dashed border-[#162DB0]/20 bg-white p-6 shadow-sm mx-auto"
                style={{
                  width: "320px",
                  height: "220px",
                  minWidth: "260px",
                  minHeight: "180px",
                  maxWidth: "100%",
                }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E4F4FF]">
                      <FileText className="h-5 w-5 text-[#162DB0]" />
                    </div>
                    <h3 className="text-left text-base font-bold text-[#00306E] whitespace-pre-line">
                      {card.title === "Oral Reading Fluency Test"
                        ? "Oral Fluency\nTest Report"
                        : card.title === "Reading Comprehension Test"
                        ? "Reading Comprehension\nTest Report"
                        : card.title}
                    </h3>
                  </div>
                  <div className="flex flex-col items-start gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-[#00306E]">
                      {Math.round(card.percentage)}%
                    </span>
                    <span
                      className={`text-lg font-bold ${getLevelColor(card.level)}`}
                    >
                      {card.level}
                    </span>
                  </div>
                </div>
               <button
  onClick={() => onViewReport(card.id)}
  className="mt-2 w-24 rounded-md border border-[#2E2E68] bg-[#2E2E68] px-0 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#222255] transition"
  type="button"
  aria-label={`View ${card.title} report`}
>
  View Report
</button>
              </div>
            ))}
          </div>
        </div>

        {/* Oral Reading Level — full width, big and aligned with 2 cards */}
        {oralReadingLevel.level && (
          <div
            className={`flex items-center gap-6 rounded-2xl border p-8 shadow-sm ${getLevelBgColor(oralReadingLevel.level)} mx-auto`}
            style={{
              width: "672px", // 2 * 320px + gap
              minWidth: "320px",
              maxWidth: "100%",
            }}
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <FileText className="h-10 w-10 text-[#162DB0]" />
            </div>
            <div className="flex flex-col items-start">
              <h3 className="text-lg font-bold text-[#00306E]">
                Oral Reading Level
              </h3>
              <span
                className={`text-3xl font-extrabold ${getLevelColor(oralReadingLevel.level)}`}
              >
                {oralReadingLevel.level}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AssessmentSummary;