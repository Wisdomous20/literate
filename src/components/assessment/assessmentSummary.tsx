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

export function AssessmentSummary({
  assessmentCards,
  oralReadingLevel,
  onViewReport,
  onExportPdf,
  onBack,
}: AssessmentSummaryProps) {
  return (
    <div className="flex min-h-full flex-col overflow-y-auto">
      <DashboardHeader
        title="Assessment Summary"
        action={
          <button
            onClick={onExportPdf}
            className="rounded-lg bg-[#162DB0] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Export to PDF
          </button>
        }
      />

      <main className="flex flex-col gap-5 px-6 py-5 lg:px-8">
        <button
          onClick={onBack}
          className="flex w-fit items-center gap-1.5 text-base font-semibold text-[#31318A] transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assessmentCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#162DB0]/25 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E4F4FF]">
                  <FileText className="h-5 w-5 text-[#162DB0]" />
                </div>
                <h3 className="text-sm font-bold text-[#00306E]">
                  {card.title}
                </h3>
              </div>

              <div className="flex items-end justify-between">
                <span className="text-4xl font-extrabold text-[#00306E]">
                  {Math.round(card.percentage)}%
                </span>
                <span
                  className={`text-base font-bold ${getLevelColor(card.level)}`}
                >
                  {card.level}
                </span>
              </div>

              <button
                onClick={() => onViewReport(card.id)}
                className="rounded-lg bg-[#2E2E68] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                View Report
              </button>
            </div>
          ))}
        </div>

        {oralReadingLevel.level && (
          <div className="flex justify-center">
            <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-[#FFF0EF] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
                  <FileText className="h-5 w-5 text-[#162DB0]" />
                </div>
                <h3 className="text-sm font-bold text-[#00306E]">
                  Final Classification
                </h3>
              </div>

              <span
                className={`text-3xl font-extrabold ${getLevelColor(oralReadingLevel.level)}`}
              >
                {oralReadingLevel.level}
              </span>

              <span className="text-xs font-semibold text-[#162DB0]">
                {oralReadingLevel.label}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}