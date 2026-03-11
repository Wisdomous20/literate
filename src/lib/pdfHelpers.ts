import type jsPDF from "jspdf";

export type RGB = [number, number, number];

/* ------------------------------------------------------------------ */
/*  Shared color palette used by all PDF reports                       */
/* ------------------------------------------------------------------ */
export const PDF_COLORS = {
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
};

/* ------------------------------------------------------------------ */
/*  Classification-level color helpers                                 */
/* ------------------------------------------------------------------ */

export function classificationBg(level: string): RGB {
  switch (level?.toLowerCase()) {
    case "independent":  return [199, 238, 204];
    case "instructional": return [207, 228, 255];
    case "frustration":  return [254, 231, 241];
    default:             return [240, 240, 251];
  }
}

export function classificationTextColor(level: string): RGB {
  switch (level?.toLowerCase()) {
    case "independent":  return [22, 163, 74];
    case "instructional": return [37, 99, 235];
    case "frustration":  return [220, 38, 38];
    default:             return [46, 46, 163];
  }
}

/** Alias — same mapping as classificationTextColor, kept for semantic clarity. */
export const getLevelColor = classificationTextColor;

/* ------------------------------------------------------------------ */
/*  Tiny drawing helpers                                               */
/* ------------------------------------------------------------------ */

export function rrect(
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

export function hline(doc: jsPDF, x: number, y: number, w: number, color: RGB, lw = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.line(x, y, x + w, y);
}

/* ------------------------------------------------------------------ */
/*  Mini-icon drawers (all drawn inside a 7×7 mm box at (bx, by))     */
/* ------------------------------------------------------------------ */

/** FileText icon — a document with lines */
export function drawFileTextIcon(doc: jsPDF, bx: number, by: number, color: RGB) {
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

/** Clock icon — circle with hands */
export function drawClockIcon(doc: jsPDF, bx: number, by: number, color: RGB) {
  const cx = bx + 3.5, cy = by + 3.5, r = 2;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.35);
  doc.circle(cx, cy, r, "S");
  doc.setLineWidth(0.3);
  doc.line(cx, cy, cx, cy - 1.2);
  doc.line(cx, cy, cx + 0.9, cy + 0.3);
}

/** ClipboardCheck icon — clipboard with a checkmark */
export function drawClipboardCheckIcon(doc: jsPDF, bx: number, by: number, color: RGB) {
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
