// src/components/assessment/assessmentSummary.tsx
import { ChevronLeft, FileText } from "lucide-react";
import { AssessmentHeader } from "@/components/assessment/assessmentHeader";

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

export function AssessmentSummary({
  assessmentCards,
  oralReadingLevel,
  onViewReport,
  onExportPdf,
  onBack,
}: AssessmentSummaryProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto">
      <AssessmentHeader title="Assessment Summary" />

      <main className="flex flex-1 flex-col gap-8 px-12 py-10">
        {/* Back + Export */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-2xl font-semibold text-[#31318A] hover:opacity-80"
          >
            <ChevronLeft className="h-7 w-7" />
            Previous
          </button>

          <button
            onClick={onExportPdf}
            className="rounded-full bg-[#162DB0] px-8 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            Export to PDF
          </button>
        </div>

        {/* Assessment Cards */}
        <div className="flex flex-wrap items-start justify-center gap-10">
          {assessmentCards.map((card) => (
            <div
              key={card.id}
              className="flex w-95 flex-col gap-6 rounded-3xl border-2 border-dashed border-[#162DB0]/30 bg-white p-10 shadow-lg"
            >
              {/* Card Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#E4F4FF]">
                  <FileText className="h-7 w-7 text-[#162DB0]" />
                </div>
                <h3 className="text-2xl font-bold text-[#00306E]">
                  {card.title}
                </h3>
              </div>

              {/* Percentage */}
              <span className="text-6xl font-extrabold text-[#00306E]">
                {Math.round(card.percentage)}%
              </span>

              {/* Level */}
              <span className="text-2xl font-bold text-[#00306E]">
                {card.level}
              </span>

              {/* View Report Button */}
              <button
                onClick={() => onViewReport(card.id)}
                className="mt-4 w-fit rounded-lg bg-[#2E2E68] px-8 py-3 text-lg font-semibold text-white transition-opacity hover:opacity-90"
              >
                View Report
              </button>
            </div>
          ))}
        </div>

        {/* Oral Reading Level Card */}
        {oralReadingLevel.level && (
          <div className="flex justify-center">
            <div className="flex w-95 flex-col gap-5 rounded-3xl bg-[#F9D4D0] p-10 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/60">
                  <FileText className="h-7 w-7 text-[#162DB0]" />
                </div>
                <h3 className="text-2xl font-bold text-[#00306E]">
                  Oral Reading Level
                </h3>
              </div>

              <span className="text-4xl font-extrabold text-red-500">
                {oralReadingLevel.level}
              </span>

              <span className="text-lg font-semibold text-[#162DB0]">
                {oralReadingLevel.label}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}