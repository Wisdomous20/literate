/**
 * Confidence is evidence of what the speech model heard, not evidence that a
 * student read the expected passage word. A strong confidence score therefore
 * prevents passage-guided post-processing from overwriting a likely real
 * spoken mismatch.
 */
const HIGH_CONFIDENCE_THRESHOLD = 0.75;

export function normalizeTranscriptionConfidence(
  value: unknown,
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < 0 || value > 1) return undefined;

  return value;
}

export function canAutoCorrectFromPassage(
  confidence: number | undefined,
): boolean {
  return confidence === undefined || confidence < HIGH_CONFIDENCE_THRESHOLD;
}

export function lowestTranscriptionConfidence(
  confidences: Array<number | undefined>,
): number | undefined {
  const valid = confidences.filter(
    (confidence): confidence is number => confidence !== undefined,
  );

  return valid.length > 0 ? Math.min(...valid) : undefined;
}
