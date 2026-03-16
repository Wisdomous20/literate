import jsPDF from "jspdf";
import {
  type RGB,
  PDF_COLORS,
  classificationBg,
  classificationTextColor,
  getLevelColor,
  rrect,
  hline,
  drawFileTextIcon,
  drawClipboardCheckIcon,
} from "./pdfHelpers";

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

// Color Palette

const C = {
  ...PDF_COLORS,
  accentTeal: [26, 102, 115] as RGB,
  accentRed: [206, 51, 12] as RGB,
  titlePurple: [102, 102, 255] as RGB,
};

/* Breakdown colours */
const BREAKDOWN_CFG: {
  key: "literal" | "inferential" | "critical";
  label: string;
  color: RGB;
  bg: RGB;
}[] = [
  { key: "literal", label: "Literal", color: [26, 95, 180], bg: [198, 222, 255] },
  { key: "inferential", label: "Inferential", color: [75, 59, 163], bg: [210, 206, 246] },
  { key: "critical", label: "Critical", color: [196, 16, 72], bg: [254, 225, 237] },
];


export function exportComprehensionReportPdf(
  data: ComprehensionReportData,
  filename = "Comprehension_Report",
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const ML = 10;
  const PW = 190;
  const GAP = 4;

  let y = 10;

  /* ═══════════ TITLE BAR ═══════════ */
  rrect(doc, ML, y, PW, 13, 2, C.headerBar);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text("Reading Comprehension Test Report", ML + 8, y + 8.5);
  y += 18;

  /* ═══════════ TOP ROW: Student Info + 2 Metric Cards ═══════════ */
  const siW = 70;
  const mcAreaW = PW - siW - GAP;
  const mcW = (mcAreaW - GAP) / 2;
  const topH = 52;

  /* ── Student Info Card ── */
  rrect(doc, ML, y, siW, topH, 3, C.cardBg, C.cardBorder);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  doc.text("Student Information", ML + 4, y + 7);
  hline(doc, ML + 3, y + 9, siW - 6, C.divider);

  const studentFields = [
    { label: "Student Name", value: data.studentName },
    { label: "Grade Level", value: data.gradeLevel },
    { label: "Class", value: data.className },
  ];
  let fy = y + 13;
  for (const f of studentFields) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.labelDark);
    doc.text(f.label, ML + 4, fy);
    fy += 2.5;
    rrect(doc, ML + 3, fy, siW - 6, 6, 3, C.fieldBg, C.fieldBorder);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.textDark);
    doc.text(f.value, ML + 7, fy + 4, { maxWidth: siW - 14 });
    fy += 9;
  }

  /* ── Metric Cards: Comprehension Rate + Comprehension Level ── */
  const mcX0 = ML + siW + GAP;
  const levelColor = getLevelColor(data.classificationLevel);

  // Card 1: Comprehension Rate
  const c1x = mcX0;
  rrect(doc, c1x, y, mcW, topH, 3, C.cardBg, C.cardBorder);
  const ib1X = c1x + 5, ib1Y = y + 6, ibS = 7;
  rrect(doc, ib1X, ib1Y, ibS, ibS, 1.5, C.iconBoxBg, C.iconBoxBorder);
  drawFileTextIcon(doc, ib1X, ib1Y, C.accentTeal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.textHeading);
  doc.text("Comprehension Rate", ib1X + ibS + 2, ib1Y + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.accentTeal);
  doc.text(`${data.percentage}%`, c1x + mcW / 2, y + 36, { align: "center" });

  // Card 2: Comprehension Level
  const c2x = mcX0 + mcW + GAP;
  rrect(doc, c2x, y, mcW, topH, 3, C.cardBg, C.cardBorder);
  const ib2X = c2x + 5, ib2Y = y + 6;
  rrect(doc, ib2X, ib2Y, ibS, ibS, 1.5, C.iconBoxBg, C.iconBoxBorder);
  drawClipboardCheckIcon(doc, ib2X, ib2Y, C.accentRed);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.textHeading);
  doc.text("Comprehension Level", ib2X + ibS + 2, ib2Y + 4.5);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(14);
  doc.setTextColor(...levelColor);
  doc.text(data.classificationLevel, c2x + mcW / 2, y + 36, { align: "center" });

  y += topH + 5;

  /* ═══════════ BOTTOM ROW: Passage Info | Comprehension Breakdown ═══════════ */
  const passW = 58;
  const brkW = PW - passW - GAP;

  // Pre-calc heights
  const breakdownRowH = BREAKDOWN_CFG.length * 8;
  const breakdownSummaryH = 3 * 7.5;
  const breakdownInternalH = 12 + breakdownRowH + 4 + breakdownSummaryH + 4;
  const passageInternalH = 12 + 5 * 12 + 2;
  const bottomH = Math.max(breakdownInternalH, passageInternalH) + 4;

  /* ── Passage Information ── */
  rrect(doc, ML, y, passW, bottomH, 3, C.cardBg, C.cardBorder);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  doc.text("Passage Information", ML + 4, y + 7);
  hline(doc, ML + 3, y + 9, passW - 6, C.divider);

  const passageFields = [
    { label: "Passage Title", value: data.passageTitle },
    { label: "Passage Level", value: data.passageLevel },
    { label: "Number of Words", value: String(data.numberOfWords) },
    { label: "Test Type", value: data.testType },
    { label: "Assessment Type", value: data.assessmentType },
  ];
  let py = y + 14;
  for (const f of passageFields) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.labelDark);
    doc.text(f.label, ML + 4, py);
    py += 2.5;
    rrect(doc, ML + 3, py, passW - 6, 6, 3, C.passageFieldBg, C.passageFieldBorder);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textDark);
    doc.text(f.value, ML + 7, py + 4, { maxWidth: passW - 14 });
    py += 9;
  }

  /* ── Comprehension Breakdown ── */
  const brkX = ML + passW + GAP;
  rrect(doc, brkX, y, brkW, bottomH, 3, C.cardBg, C.cardBorder);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.titlePurple);
  doc.text("COMPREHENSION BREAKDOWN", brkX + 4, y + 7);

  let by = y + 14;
  BREAKDOWN_CFG.forEach((item, i) => {
    const tag = data[item.key];
    const displayValue = `${tag.correct}/${tag.total}`;

    // badge
    rrect(doc, brkX + 3, by, 8, 5.5, 1, item.bg, C.iconBoxBorder);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...item.color);
    doc.text(displayValue, brkX + 7, by + 3.8, { align: "center" });

    // label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...item.color);
    doc.text(item.label, brkX + 14, by + 3.8);

    by += 7;
    if (i < BREAKDOWN_CFG.length - 1) {
      hline(doc, brkX + 3, by, brkW - 6, C.dividerLight, 0.15);
    }
    by += 1;
  });

  // Summary rows
  by += 4;
  const compRate = data.totalItems > 0 ? `${data.percentage}%` : "--";
  const summaryRows: { label: string; value: string; bg: RGB; valueColor?: RGB }[] = [
    { label: "Total Score:", value: `${data.score}/${data.totalItems}`, bg: C.summaryBg1 },
    { label: "Comprehension Rate:", value: compRate, bg: C.summaryBg2 },
    {
      label: "Comprehension Level:",
      value: data.classificationLevel,
      bg: classificationBg(data.classificationLevel),
      valueColor: classificationTextColor(data.classificationLevel),
    },
  ];
  for (const row of summaryRows) {
    rrect(doc, brkX + 3, by, brkW - 6, 6.5, 1, row.bg);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...C.purple);
    doc.text(row.label, brkX + 5, by + 4.2);
    doc.setFontSize(7);
    doc.setTextColor(...(row.valueColor ?? C.deepPurple));
    doc.text(row.value, brkX + brkW - 5, by + 4.5, { align: "right" });
    by += 7.5;
  }

  /* ═══════════ SAVE ═══════════ */
  doc.save(`${filename}.pdf`);
}
