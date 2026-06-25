import jsPDF from "jspdf";
import {
  calculateWordsCorrectPerMinute,
  getDisplayReadingTimeSeconds,
  resolveReadingDurationSeconds,
} from "./readingDuration";
import { buildReadingBehaviorItems } from "./readingBehaviors";

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
  const duration = resolveReadingDurationSeconds(
    analysisResult.duration,
    input.recordedSeconds,
  );
  const totalMiscues = analysisResult.totalMiscues ?? 0;
  const wordsCorrect = Math.max(0, totalWords - totalMiscues);
  const wcpm = calculateWordsCorrectPerMinute(wordsCorrect, duration);

  const counts: Record<string, number> = {};
  for (const m of analysisResult.miscues) {
    counts[m.miscueType] = (counts[m.miscueType] || 0) + 1;
  }

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
    readingTimeSeconds: getDisplayReadingTimeSeconds(duration),
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
    behaviors: buildReadingBehaviorItems(analysisResult.behaviors).map(
      ({ label, description, checked }) => ({ label, description, checked }),
    ),
  };
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

export function exportFluencyReportPdf(
  data: FluencyReportData,
  filename = "Oral_Fluency_Report",
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
  doc.text("Reading Fluency Test Report", left, y);
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
  ensureSpace(36);
  addSectionTitle(doc, "Performance Summary", left, y);
  y += 7;
  y = addKeyValueRows(
    doc,
    [
      ["Reading Rate (WCPM)", String(data.wcpm)],
      ["Reading Time", `${data.readingTimeSeconds} seconds`],
      ["Oral Fluency Score", data.miscueData.oralFluencyScore],
      ["Classification Level", data.classificationLevel],
    ],
    left,
    y,
    width,
  );

  const classColor = classificationColor(data.classificationLevel);
  doc.setTextColor(...classColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.classificationLevel, left + 56, y - 6);
  doc.setTextColor(17, 24, 39);

  y += 4;
  ensureSpace(70);
  addSectionTitle(doc, "Miscue Analysis", left, y);
  y += 7;
  y = addKeyValueRows(
    doc,
    [
      ["Mispronunciation", String(data.miscueData.mispronunciation)],
      ["Omission", String(data.miscueData.omission)],
      ["Substitution", String(data.miscueData.substitution)],
      ["Transposition", String(data.miscueData.transposition)],
      ["Reversal", String(data.miscueData.reversal)],
      ["Insertion", String(data.miscueData.insertion)],
      ["Repetition", String(data.miscueData.repetition)],
      ["Self-Correction", String(data.miscueData.selfCorrection)],
      ["Total Miscue", String(data.miscueData.totalMiscue)],
    ],
    left,
    y,
    width,
  );

  y += 4;
  ensureSpace(50);
  addSectionTitle(doc, "Observed Behaviors", left, y);
  y += 7;
  data.behaviors.forEach((behavior) => {
    const prefix = behavior.checked ? "[x]" : "[ ]";
    const line = `${prefix} ${behavior.label} ${behavior.description}`;
    const lines = doc.splitTextToSize(line, width) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(lines, left, y);
    y += lines.length * 4.8 + 1.5;
  });

  if (data.otherObservations?.trim()) {
    y += 2;
    ensureSpace(28);
    addSectionTitle(doc, "Other Observations", left, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(data.otherObservations.trim(), width) as string[], left, y);
  }

  doc.save(`${filename}.pdf`);
}
