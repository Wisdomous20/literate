import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

const MIN_PAUSE_FOR_CORRECTION = 0.5  // seconds
const MAX_PAUSE_FOR_CORRECTION = 2.0  // seconds

function getGap(current: AlignedWord, next: AlignedWord): number | null {
  if (current.endTimestamp == null || next.timestamp == null) return null;
  return next.timestamp - current.endTimestamp;
}

export default function detectSelfCorrections(
  alignedWords: AlignedWord[],
  repetitionIndices: Set<number>
): Set<number> {
  const indices = new Set<number>();

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const current = alignedWords[i];
    const next = alignedWords[i + 1];

    // Skip if either word is already marked as a repetition
    if (repetitionIndices.has(i) || repetitionIndices.has(i + 1)) continue;

    const gap = getGap(current, next);

    // No timing data → can't determine pause, skip
    if (gap === null) continue;

    const hasCorrectionPause = gap >= MIN_PAUSE_FOR_CORRECTION 
                             && gap <= MAX_PAUSE_FOR_CORRECTION;

    if (!hasCorrectionPause) continue;

    // Pattern 1: INSERTION (wrong word) → EXACT (correct word) with a pause
if (
  current.match === "INSERTION" &&
  next.match === "EXACT" &&
  current.spoken &&
  next.expected
) {
  const spokenNorm = normalizeWord(current.spoken);
  const expectedNorm = normalizeWord(next.expected);

  // If too similar to the next word, it's a repetition not a correction
  if (similarityRatio(spokenNorm, expectedNorm) > 0.8) continue;

  // Only flag as self-correction if the spoken word resembles a nearby
  // omitted or mismatched passage word (i.e., a failed attempt at reading it)
  let isAttemptAtNearbyWord = false;
  for (let k = Math.max(0, i - 3); k <= Math.min(alignedWords.length - 1, i + 3); k++) {
    if (k === i) continue;
    const nearby = alignedWords[k];
    if ((nearby.match === "OMISSION" || nearby.match === "MISMATCH") && nearby.expected) {
      if (similarityRatio(spokenNorm, normalizeWord(nearby.expected)) > 0.5) {
        isAttemptAtNearbyWord = true;
        break;
      }
    }
  }
  if (!isAttemptAtNearbyWord) continue;

  indices.add(i);
}

    // Pattern 2: MISMATCH (wrong word) → INSERTION (correction attempt) with a pause
    if (
      current.match === "MISMATCH" &&
      next.match === "INSERTION" &&
      next.spoken &&
      current.expected
    ) {
      const sim = similarityRatio(
        normalizeWord(next.spoken),
        normalizeWord(current.expected)
      );
      if (sim > 0.8) indices.add(i);
    }

    // Pattern 3: MISMATCH (wrong word) → EXACT (correct re-read) with a pause
    // The reader misread, paused, then re-read the word correctly
    if (
      current.match === "MISMATCH" &&
      next.match === "EXACT" &&
      current.spoken &&
      current.expected
    ) {
      indices.add(i);
    }
  }

  return indices;
}