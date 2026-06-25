import jsPDF from "jspdf";

export interface ComprehensionReportData {
  studentName: string;
  gradeLevel: string;
  className: string;
  passageTitle: string;
  passageLevel: string;
  numberOfWords: number;
  testType: string;
  assessmentType: string;
  score: number;
  totalItems: number;
  percentage: number;
  classificationLevel: string;
  literal: { correct: number; total: number };
  inferential: { correct: number; total: number };
  critical: { correct: number; total: number };
}

function classificationColor(level: string): [number, number, number] {
  switch (level.trim().toUpperCase()) {
    case "FRUSTRATION":
      return [220, 38, 38];
    case "INSTRUCTIONAL":
      return [37, 99, 235];
    case "INDEPENDENT":
      return [22, 163, 74];
    default:
      return [17, 24, 39];
  }
}

function addSectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(text, x, y);
}

function addKeyValueRows(
  doc: jsPDF,
  rows: Array<[string, string]>,
  x: number,
  startY: number,
  maxWidth: number,
) {
  let y = startY;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(`${label}:`, x, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "\u2014", maxWidth - labelWidth) as string[];
    doc.text(lines, x + labelWidth + 1, y);
    y += Math.max(6, lines.length * 4.8);
  });
  return y;
}

export function exportComprehensionReportPdf(
  data: ComprehensionReportData,
  filename = "Comprehension_Report",
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = 18;
  const width = 174;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 20) return;
    doc.addPage();
    y = 20;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Reading Comprehension Test Report", left, y);
  y += 8;
  doc.setDrawColor(31, 41, 55);
  doc.setLineWidth(0.4);
  doc.line(left, y, left + width, y);
  y += 8;

  y = addKeyValueRows(
    doc,
    [
      ["Student Name", data.studentName],
      ["Grade Level", data.gradeLevel],
      ["Class", data.className],
      ["Passage Title", data.passageTitle],
      ["Passage Level", data.passageLevel],
      ["Number of Words", String(data.numberOfWords)],
      ["Test Type", data.testType],
      ["Assessment Type", data.assessmentType],
    ],
    left,
    y,
    width,
  );

  y += 4;
  ensureSpace(40);
  addSectionTitle(doc, "Performance Summary", left, y);
  y += 7;
  y = addKeyValueRows(
    doc,
    [
      ["Total Score", `${data.score}/${data.totalItems}`],
      ["Comprehension Rate", `${data.percentage}%`],
      ["Classification Level", data.classificationLevel],
    ],
    left,
    y,
    width,
  );

  const classColor = classificationColor(data.classificationLevel);
  doc.setTextColor(...classColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.classificationLevel, left + 55, y - 6);
  doc.setTextColor(17, 24, 39);

  y += 4;
  ensureSpace(30);
  addSectionTitle(doc, "Comprehension Breakdown", left, y);
  y += 7;
  addKeyValueRows(
    doc,
    [
      ["Literal", `${data.literal.correct}/${data.literal.total}`],
      ["Inferential", `${data.inferential.correct}/${data.inferential.total}`],
      ["Critical", `${data.critical.correct}/${data.critical.total}`],
    ],
    left,
    y,
    width,
  );

  doc.save(`${filename}.pdf`);
}
