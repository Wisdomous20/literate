"use client";

import { ChevronLeft, FileText } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboardHeader";
import Image from "next/image";
import jsPDF from "jspdf";

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

function generatePDF(
  studentName: string,
  studentGrade: string,
  assessmentTypeLabel: string,
  oralReadingLevel: OralReadingLevel,
  assessmentCards: AssessmentCard[],
) {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margins = 15;
  const contentWidth = pageWidth - 2 * margins;

  doc.setFont("helvetica");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ASSESSMENT REPORT", margins, yPosition);
  yPosition += 10;

  doc.setDrawColor(0);
  doc.line(margins, yPosition, pageWidth - margins, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", margins, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${studentName}`, margins + 5, yPosition);
  yPosition += 6;
  doc.text(`Grade Level: ${studentGrade}`, margins + 5, yPosition);
  yPosition += 6;
  doc.text(`Assessment Type: ${assessmentTypeLabel}`, margins + 5, yPosition);
  yPosition += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margins + 5, yPosition);
  yPosition += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Final Reading Level Classification", margins, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Classification: ${oralReadingLevel.level}`, margins + 5, yPosition);
  yPosition += 6;

  const description = getClassificationSubtext(oralReadingLevel.level);
  const descriptionLines = doc.splitTextToSize(description, contentWidth - 5);
  doc.text(descriptionLines, margins + 5, yPosition);
  yPosition += descriptionLines.length * 5 + 5;

  const reportsToInclude = assessmentCards.slice(0, 2);

  reportsToInclude.forEach((card, index) => {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const reportTitle =
      card.title === "Oral Reading Fluency Test"
        ? "Oral Fluency Test Report"
        : card.title === "Reading Comprehension Test"
          ? "Reading Comprehension Test Report"
          : card.title;

    doc.text(`Report ${index + 1}: ${reportTitle}`, margins, yPosition);
    yPosition += 7;

    doc.setDrawColor(200);
    doc.line(margins, yPosition, pageWidth - margins, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Assessment Type: ${card.title}`, margins + 5, yPosition);
    yPosition += 6;
    doc.text(`Classification Level: ${card.level}`, margins + 5, yPosition);
    yPosition += 6;
    doc.text(
      `Performance Score: ${Math.round(card.percentage)}%`,
      margins + 5,
      yPosition,
    );
    yPosition += 6;

    let performanceText = "";
    if (card.percentage >= 90) {
      performanceText = "Excellent performance";
    } else if (card.percentage >= 75) {
      performanceText = "Good performance";
    } else if (card.percentage >= 60) {
      performanceText = "Satisfactory performance";
    } else {
      performanceText = "Needs improvement";
    }
    doc.text(`Performance: ${performanceText}`, margins + 5, yPosition);
    yPosition += 10;
  });

  yPosition = doc.internal.pageSize.getHeight() - 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margins, yPosition);
  doc.text(`Page 1 of 1`, pageWidth - margins - 20, yPosition);

  doc.save(`${studentName}-assessment-report.pdf`);
}

export function AssessmentSummary({
  studentName,
  studentGrade,
  assessmentTypeLabel,
  oralReadingLevel,
  assessmentCards,
  onViewReport,
  onExportPdf,
  onBack,
}: AssessmentSummaryProps) {
  const handleExportPdf = () => {
    generatePDF(
      studentName,
      studentGrade,
      assessmentTypeLabel,
      oralReadingLevel,
      assessmentCards,
    );
    onExportPdf?.();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DashboardHeader title="Reading Level" schoolYear="" />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 lg:px-8">
        <div className="rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] h-full flex flex-col">
          <div className="px-6 py-4 bg-[#E0E7FF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6666FF] text-white hover:bg-[#9333EA] transition-all shadow-sm active:scale-95"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-black uppercase tracking-widest">
                      {studentGrade}
                    </span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[#3B2F7F] bg-[#dcdff8f9] border border-[#A855F7]">
                      {assessmentTypeLabel}
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-black leading-tight">
                    {studentName}
                  </h1>
                </div>
              </div>
              <button
                onClick={handleExportPdf}
                className="rounded-lg bg-[#297CEC] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                type="button"
              >
                Export to PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {oralReadingLevel.level && (
              <div className="relative rounded-2xl overflow-hidden mb-6 h-48">
                <div className="absolute inset-0 bg-[url('/images/Class-bg.png')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-linear-to-r from-[#6666FF]/90 to-[#6666FF]/75" />

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

            <div className="border-t border-[#E5E7EB] my-6" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {assessmentCards.map((card) => (
                <div
                  key={card.id}
                  className="
    rounded-xl overflow-hidden
    border-l-2 border-t-2 border-r-4 border-b-4
    border-l-[#E5E7EB] border-t-[#E5E7EB]
    border-r-[#2E2E68] border-b-[#2E2E68]
  "
                >
                  <div className="bg-white p-6 flex flex-col h-full">
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

                    <div className="mb-4">
                      <span
                        className={`text-lg font-bold ${getLevelColor(card.level)}`}
                      >
                        {card.level}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressBarColor(card.level)} transition-all ${
                              card.percentage === 100
                                ? "w-full"
                                : card.percentage >= 75
                                  ? "w-3/4"
                                  : card.percentage >= 50
                                    ? "w-1/2"
                                    : card.percentage >= 25
                                      ? "w-1/4"
                                      : "w-0"
                            }`}
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
