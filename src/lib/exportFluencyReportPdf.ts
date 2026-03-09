import jsPDF from "jspdf";
import {
  type RGB,
  PDF_COLORS,
  classificationBg,
  classificationTextColor,
  rrect,
  hline,
  drawFileTextIcon,
  drawClockIcon,
  drawClipboardCheckIcon,
} from "./pdfHelpers";

/* ------------------------------------------------------------------ */
/*  Public data interface – callers build this from session state      */
/* ------------------------------------------------------------------ */

export interface FluencyReportData {
  studentName: string;
  gradeLevel: string;
  className: string;
  passageTitle: string;
  passageLevel: string;
  numberOfWords: number;
  testType: string;
  assessmentType: string;
  wcpm: number;
  readingTimeSeconds: number;
  classificationLevel: string;
  miscueData: {
    mispronunciation: number;
    omission: number;
    substitution: number;
    transposition: number;
    reversal: number;
    insertion: number;
    repetition: number;
    selfCorrection: number;
    totalMiscue: number;
    oralFluencyScore: string;
    classificationLevel: string;
  };
  behaviors: { label: string; description: string; checked: boolean }[];
  otherObservations?: string;
}

/* ------------------------------------------------------------------ */
/*  Shared builder – assembles FluencyReportData from page state       */
/* ------------------------------------------------------------------ */

export interface FluencyExportInput {
  studentName: string;
  gradeLevel: string;
  selectedClassName: string;
  selectedTitle?: string;
  selectedLevel?: string;
  selectedTestType?: string;
  assessmentType: string;
  passageContent: string;
  recordedSeconds: number;
  analysisResult: {
    duration?: number;
    totalMiscues?: number;
    oralFluencyScore: number;
    classificationLevel: string;
    miscues: { miscueType: string }[];
    behaviors: { behaviorType: string }[];
  };
}

export function buildFluencyReportData(input: FluencyExportInput): FluencyReportData {
  const { analysisResult } = input;
  const totalWords = input.passageContent.split(/\s+/).filter(Boolean).length;
  const duration = analysisResult.duration ?? input.recordedSeconds;
  const totalMiscues = analysisResult.totalMiscues ?? 0;
  const wordsCorrect = Math.max(0, totalWords - totalMiscues);
  const wcpm = duration > 0 ? Math.round((wordsCorrect / duration) * 60) : 0;

  const counts: Record<string, number> = {};
  for (const m of analysisResult.miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
  }

  const detectedBehaviors = new Set(analysisResult.behaviors.map((b) => b.behaviorType));

  return {
    studentName: input.studentName,
    gradeLevel: input.gradeLevel ? `Grade ${input.gradeLevel}` : "\u2014",
    className: input.selectedClassName,
    passageTitle: input.selectedTitle || "\u2014",
    passageLevel: input.selectedLevel || "\u2014",
    numberOfWords: totalWords,
    testType: input.selectedTestType || "\u2014",
    assessmentType: input.assessmentType,
    wcpm,
    readingTimeSeconds: Math.round(duration),
    classificationLevel: analysisResult.classificationLevel,
    miscueData: {
      mispronunciation: counts["MISPRONUNCIATION"] || 0,
      omission: counts["OMISSION"] || 0,
      substitution: counts["SUBSTITUTION"] || 0,
      transposition: counts["TRANSPOSITION"] || 0,
      reversal: counts["REVERSAL"] || 0,
      insertion: counts["INSERTION"] || 0,
      repetition: counts["REPETITION"] || 0,
      selfCorrection: counts["SELF_CORRECTION"] || 0,
      totalMiscue: totalMiscues,
      oralFluencyScore: `${analysisResult.oralFluencyScore}%`,
      classificationLevel: analysisResult.classificationLevel,
    },
    behaviors: [
      { label: "Does word-by-word reading", description: "(Nagbabasa nang pa-isa isang salita)", checked: detectedBehaviors.has("WORD_BY_WORD_READING") },
      { label: "Lacks expression: reads in a monotonous tone", description: "(Walang damdamin; walang pagbabago ang tono)", checked: detectedBehaviors.has("MONOTONOUS_READING") },
      { label: "Disregards Punctuation", description: "(Hindi pinapansin ang mga bantas)", checked: detectedBehaviors.has("DISMISSAL_OF_PUNCTUATION") },
      { label: "Employs little or no method of analysis", description: "(Bahagya o walang paraan ng pagsusuri)", checked: false },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Colour palette                                                     */
/* ------------------------------------------------------------------ */

const C = {
  ...PDF_COLORS,
  checkFill: [93, 93, 251] as RGB,       // #5D5DFB
  obsBg: [240, 240, 252] as RGB,
  rateColor: [22, 45, 176] as RGB,       // #162DB0
  timeColor: [26, 102, 115] as RGB,      // #1A6673
  classColor: [206, 51, 12] as RGB,      // #CE330C
};

/* per‑miscue colours */
const MISCUE_CFG: {
  key: keyof FluencyReportData["miscueData"];
  label: string;
  color: RGB;
  bg: RGB;
}[] = [
  { key: "mispronunciation", label: "Mispronunciation", color: [196, 16, 72], bg: [254, 225, 237] },
  { key: "omission", label: "Omission", color: [75, 59, 163], bg: [210, 206, 246] },
  { key: "substitution", label: "Substitution", color: [26, 95, 180], bg: [198, 222, 255] },
  { key: "transposition", label: "Transposition", color: [139, 0, 139], bg: [234, 176, 234] },
  { key: "reversal", label: "Reversal", color: [110, 64, 35], bg: [219, 203, 191] },
  { key: "insertion", label: "Insertion", color: [30, 122, 53], bg: [186, 234, 192] },
  { key: "repetition", label: "Repetition", color: [184, 92, 0], bg: [255, 225, 188] },
  { key: "selfCorrection", label: "Self-Correction", color: [138, 109, 0], bg: [252, 241, 188] },
];

/* ------------------------------------------------------------------ */
/*  Fluency‑specific helpers                                           */
/* ------------------------------------------------------------------ */

function formatTime(s: number): { value: string; subtitle: string } {
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return { value: m ? `${h}:${String(m).padStart(2, "0")}` : String(h), subtitle: m ? "Hours & Minutes" : "Hours" };
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return { value: sec ? `${m}:${String(sec).padStart(2, "0")}` : String(m), subtitle: sec ? "Minutes & Seconds" : "Minutes" };
  }
  return { value: String(Math.round(s)), subtitle: "Seconds" };
}

/* ------------------------------------------------------------------ */
/*  Main export function                                               */
/* ------------------------------------------------------------------ */

export function exportFluencyReportPdf(
  data: FluencyReportData,
  filename = "Oral_Fluency_Report",
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const ML = 10;          // margin‑left
  const PW = 190;         // page usable width
  const GAP = 4;          // gap between cards

  let y = 10;             // current vertical cursor

  /* ═══════════ TITLE BAR ═══════════ */
  rrect(doc, ML, y, PW, 13, 2, C.headerBar);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text("Oral Fluency Test Report", ML + 8, y + 8.5);
  y += 18;

  /* ═══════════ TOP ROW: Student Info + 3 Metric Cards ═══════════ */
  const siW = 48;                                       // student‑info width
  const mcAreaW = PW - siW - GAP;                       // metric area width
  const mcW = (mcAreaW - GAP * 2) / 3;                  // single metric card width
  const topH = 62;                                      // row height

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
  let fy = y + 14;
  for (const f of studentFields) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.labelDark);
    doc.text(f.label, ML + 4, fy);
    fy += 3;
    rrect(doc, ML + 3, fy, siW - 6, 7, 3.5, C.fieldBg, C.fieldBorder);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.textDark);
    doc.text(f.value, ML + 7, fy + 4.5, { maxWidth: siW - 14 });
    fy += 12;
  }

  /* ── Metric Cards ── */
  const rt = formatTime(data.readingTimeSeconds);
  const metrics: {
    t1: string; t2: string; value: string;
    sub: string; accent: RGB; italic?: boolean; smallValue?: boolean;
    drawIcon: (doc: jsPDF, bx: number, by: number, color: RGB) => void;
    iconColor: RGB;
  }[] = [
    { t1: "Reading Rate", t2: "(WCPM)", value: String(data.wcpm), sub: "Words Correct Per Minute", accent: C.rateColor, drawIcon: drawFileTextIcon, iconColor: C.rateColor },
    { t1: "Reading", t2: "Time", value: rt.value, sub: rt.subtitle, accent: C.timeColor, drawIcon: drawClockIcon, iconColor: C.timeColor },
    { t1: "Fluency", t2: "Classification", value: data.classificationLevel, sub: "", accent: C.classColor, italic: true, smallValue: true, drawIcon: drawClipboardCheckIcon, iconColor: C.classColor },
  ];
  const mcX0 = ML + siW + GAP;

  metrics.forEach((m, i) => {
    const cx = mcX0 + i * (mcW + GAP);
    rrect(doc, cx, y, mcW, topH, 3, C.cardBg, C.cardBorder);

    // icon box with drawn icon
    const ibS = 7;
    const ibX = cx + (mcW / 2) - 12;
    const ibY = y + 6;
    rrect(doc, ibX, ibY, ibS, ibS, 1.5, C.iconBoxBg, C.iconBoxBorder);
    m.drawIcon(doc, ibX, ibY, m.iconColor);

    // title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.textHeading);
    doc.text(m.t1, ibX + ibS + 2, ibY + 3);
    doc.text(m.t2, ibX + ibS + 2, ibY + 7);

    // large value
    doc.setFont("helvetica", m.italic ? "bolditalic" : "bold");
    doc.setFontSize(m.smallValue ? 13 : 22);
    doc.setTextColor(...m.accent);
    doc.text(m.value, cx + mcW / 2, y + 40, { align: "center" });

    // subtitle
    if (m.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...C.rateColor);
      doc.text(m.sub, cx + mcW / 2, y + 48, { align: "center" });
    }
  });

  y += topH + 5;

  /* ═══════════ BOTTOM ROW: Passage Info | Behavior | Miscue ═══════════ */
  const colW = (PW - GAP * 2) / 3;

  // Pre‑calculate bottom row height so all three cards are equal
  const miscueRowH = MISCUE_CFG.length * 6.5;           // 8 rows
  const miscueSummaryH = 3 * 7.5;                       // 3 summary rows
  const miscueInternalH = 10 + miscueRowH + 4 + miscueSummaryH + 4;
  const passageInternalH = 12 + 5 * 12.5 + 2;
  const behaviorInternalH = 16 + data.behaviors.length * 10 + 20;
  const bottomH = Math.max(miscueInternalH, passageInternalH, behaviorInternalH) + 4;

  const c1X = ML;
  const c2X = ML + colW + GAP;
  const c3X = ML + (colW + GAP) * 2;

  /* ── Passage Information ── */
  rrect(doc, c1X, y, colW, bottomH, 3, C.cardBg, C.cardBorder);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.textDark);
  doc.text("Passage Information", c1X + 4, y + 7);
  hline(doc, c1X + 3, y + 9, colW - 6, C.divider);

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
    doc.text(f.label, c1X + 4, py);
    py += 3;
    rrect(doc, c1X + 3, py, colW - 6, 6, 3, C.passageFieldBg, C.passageFieldBorder);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textDark);
    doc.text(f.value, c1X + 7, py + 4, { maxWidth: colW - 14 });
    py += 9.5;
  }

  /* ── Oral Behavior Checklist ── */
  rrect(doc, c2X, y, colW, bottomH, 3, C.cardBg, C.cardBorder);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.textHeading);
  doc.text("Oral Behavior Checklist", c2X + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(40, 19, 19);
  doc.text("Behavior analysis during reading", c2X + 4, y + 11);

  let by = y + 16;
  data.behaviors.forEach((b, i) => {
    const cbX = c2X + 4;
    const cbS = 4;
    if (b.checked) {
      rrect(doc, cbX, by, cbS, cbS, 0.5, C.checkFill);
      // checkmark
      doc.setDrawColor(...C.white);
      doc.setLineWidth(0.5);
      doc.line(cbX + 0.8, by + 2, cbX + 1.8, by + 3);
      doc.line(cbX + 1.8, by + 3, cbX + 3.2, by + 1);
    } else {
      rrect(doc, cbX, by, cbS, cbS, 0.5, C.white, C.checkFill);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...C.purple);
    doc.text(b.label, cbX + cbS + 2, by + 2, { maxWidth: colW - cbS - 10 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4);
    doc.text(b.description, cbX + cbS + 2, by + 5.5, { maxWidth: colW - cbS - 10 });

    by += 9;
    if (i < data.behaviors.length - 1) {
      hline(doc, c2X + 3, by, colW - 6, C.dividerLight, 0.15);
    }
    by += 1;
  });

  // Other Observations
  by += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...C.purple);
  doc.text("Other Observations (Ibang Puna)", c2X + 4, by);
  by += 2;
  rrect(doc, c2X + 3, by, colW - 6, 14, 1, C.obsBg);
  if (data.otherObservations) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(...C.purple);
    doc.text(data.otherObservations, c2X + 5, by + 4, { maxWidth: colW - 10 });
  }

  /* ── Miscue Analysis ── */
  rrect(doc, c3X, y, colW, bottomH, 3, C.cardBg, C.cardBorder);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.textHeading);
  doc.text("Miscue Analysis", c3X + 4, y + 7);

  let my = y + 13;
  MISCUE_CFG.forEach((item, i) => {
    const count = data.miscueData[item.key] as number;
    // badge
    rrect(doc, c3X + 3, my, 6, 5, 1, item.bg, C.iconBoxBorder);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...item.color);
    doc.text(String(count), c3X + 6, my + 3.5, { align: "center" });
    // label
    doc.text(item.label, c3X + colW - 4, my + 3.5, { align: "right" });

    my += 6;
    if (i < MISCUE_CFG.length - 1) hline(doc, c3X + 3, my, colW - 6, C.dividerLight, 0.15);
    my += 0.5;
  });

  // Summary
  my += 3;
  const summaryRows: { label: string; value: string; bg: RGB; valueColor?: RGB }[] = [
    { label: "Total Miscue:", value: String(data.miscueData.totalMiscue), bg: C.summaryBg1 },
    { label: "Oral Fluency Score:", value: data.miscueData.oralFluencyScore, bg: C.summaryBg2 },
    {
      label: "Classification Level:",
      value: data.miscueData.classificationLevel,
      bg: classificationBg(data.miscueData.classificationLevel),
      valueColor: classificationTextColor(data.miscueData.classificationLevel),
    },
  ];
  for (const row of summaryRows) {
    rrect(doc, c3X + 3, my, colW - 6, 6.5, 1, row.bg);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...C.purple);
    doc.text(row.label, c3X + 5, my + 4.2);
    doc.setFontSize(7);
    doc.setTextColor(...(row.valueColor ?? C.deepPurple));
    doc.text(row.value, c3X + colW - 5, my + 4.5, { align: "right" });
    my += 7.5;
  }

  /* ═══════════ SAVE ═══════════ */
  doc.save(`${filename}.pdf`);
}
