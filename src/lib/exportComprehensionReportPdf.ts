import jsPDF from "jspdf";

/* ------------------------------------------------------------------ */
/*  Public data interface                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Colour palette                                                     */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

const C = {
  cardBg: [239, 253, 255] as RGB,
  cardBorder: [84, 164, 255] as RGB,
  headerBar: [41, 124, 236] as RGB,
  textDark: [0, 48, 110] as RGB,
  textHeading: [0, 51, 102] as RGB,
  labelDark: [12, 21, 52] as RGB,
  purple: [49, 49, 138] as RGB,
  deepPurple: [46, 46, 163] as RGB,
  divider: [18, 48, 220] as RGB,
  dividerLight: [180, 190, 230] as RGB,
  fieldBg: [240, 247, 255] as RGB,
  fieldBorder: [130, 150, 220] as RGB,
  passageFieldBg: [244, 246, 249] as RGB,
  passageFieldBorder: [230, 233, 240] as RGB,
  iconBoxBg: [245, 245, 255] as RGB,
  iconBoxBorder: [218, 230, 255] as RGB,
  white: [255, 255, 255] as RGB,
  summaryBg1: [230, 230, 250] as RGB,
  summaryBg2: [235, 235, 248] as RGB,
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

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                    */
/* ------------------------------------------------------------------ */

function rrect(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  r: number,
  fill?: RGB, stroke?: RGB,
) {
  if (fill) doc.setFillColor(...fill);
  if (stroke) {
    doc.setDrawColor(...stroke);
    doc.setLineWidth(0.3);
  }
  const mode = fill && stroke ? "FD" : fill ? "F" : "S";
  doc.roundedRect(x, y, w, h, r, r, mode);
}

function hline(doc: jsPDF, x: number, y: number, w: number, color: RGB, lw = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.line(x, y, x + w, y);
}

/* Mini-icon drawers */

function drawFileTextIcon(doc: jsPDF, bx: number, by: number, color: RGB) {
  const cx = bx + 3.5, cy = by + 3.5;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  const l = cx - 1.6, r = cx + 1.6, t = cy - 2, b = cy + 2, fold = 1;
  doc.line(l, t, r - fold, t);
  doc.line(r - fold, t, r, t + fold);
  doc.line(r, t + fold, r, b);
  doc.line(r, b, l, b);
  doc.line(l, b, l, t);
  doc.setLineWidth(0.25);
  doc.line(l + 0.6, cy - 0.6, r - 0.6, cy - 0.6);
  doc.line(l + 0.6, cy + 0.3, r - 0.6, cy + 0.3);
  doc.line(l + 0.6, cy + 1.2, cx + 0.4, cy + 1.2);
}

function drawClipboardCheckIcon(doc: jsPDF, bx: number, by: number, color: RGB) {
  const cx = bx + 3.5, cy = by + 3.5;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  const l = cx - 1.6, r = cx + 1.6, t = cy - 1.6, b = cy + 2;
  doc.roundedRect(l, t, r - l, b - t, 0.4, 0.4, "S");
  doc.roundedRect(cx - 0.8, t - 0.6, 1.6, 0.9, 0.3, 0.3, "S");
  doc.setLineWidth(0.35);
  doc.line(cx - 0.8, cy + 0.3, cx - 0.1, cy + 1);
  doc.line(cx - 0.1, cy + 1, cx + 1, cy - 0.4);
}

function classificationBg(level: string): RGB {
  switch (level?.toLowerCase()) {
    case "independent": return [199, 238, 204];
    case "instructional": return [207, 228, 255];
    case "frustration": return [254, 231, 241];
    default: return [240, 240, 251];
  }
}

function classificationTextColor(level: string): RGB {
  switch (level?.toLowerCase()) {
    case "independent": return [22, 163, 74];
    case "instructional": return [37, 99, 235];
    case "frustration": return [220, 38, 38];
    default: return [46, 46, 163];
  }
}

function getLevelColor(level: string): RGB {
  switch (level?.toLowerCase()) {
    case "frustration": return [220, 38, 38];
    case "instructional": return [37, 99, 235];
    case "independent": return [22, 163, 74];
    default: return [206, 51, 12];
  }
}

/* ------------------------------------------------------------------ */
/*  Main export function                                               */
/* ------------------------------------------------------------------ */

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
  const compRate = data.totalItems > 0 ? `${Math.round((data.score / data.totalItems) * 100)}%` : "--";
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
