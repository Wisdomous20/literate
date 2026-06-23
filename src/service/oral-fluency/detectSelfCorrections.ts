import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

const MAX_PAUSE_FOR_CORRECTION = 2.0
const MIN_SELF_CORRECTION_SIMILARITY = 0.5

function getGap(current: AlignedWord, next: AlignedWord): number | null {
  if (current.endTimestamp == null || next.timestamp == null) return null;
  return next.timestamp - current.endTimestamp;
}

export default function detectSelfCorrections(
  alignedWords: AlignedWord[],
  repetitionIndices: Set<number>
): Set<number> {
  const indices = new Set<number>();

  // Self-correction pattern: INSERTION (wrong attempt) → pause ≥ 200ms → EXACT
  // (correct word). The insertion is the self-correction; it is never a
  // repetition (those are handled by detectRepetitions first).
  for (let i = 0; i < alignedWords.length - 1; i++) {
    const current = alignedWords[i];
    const next = alignedWords[i + 1];

    if (repetitionIndices.has(i) || repetitionIndices.has(i + 1)) continue;

    if (current.match !== "INSERTION" || next.match !== "EXACT") continue;
    if (!current.spoken || !next.expected) continue;

    // If the inserted token exactly repeats the preceding spoken or expected
    // word, it is a repetition rather than an attempt to correct the next one.
    const previous = alignedWords[i - 1];
    const normalizedCurrent = normalizeWord(current.spoken);
    if (
      normalizedCurrent === normalizeWord(previous?.expected ?? "") ||
      normalizedCurrent === normalizeWord(previous?.spoken ?? "")
    ) {
      continue;
    }

    const gap = getGap(current, next);
    if (gap === null) continue;
    if (gap < 0 || gap > MAX_PAUSE_FOR_CORRECTION) continue;

    // If the insertion is nearly identical to the following correct word, it's
    // a stutter/repetition rather than a self-correction.
    const sim = similarityRatio(
      normalizeWord(current.spoken),
      normalizeWord(next.expected)
    );
    if (sim > 0.8) continue;

    // A self-correction must be related to its target. A dissimilar extra
    // word is an insertion even if the student immediately continues reading.
    if (sim < MIN_SELF_CORRECTION_SIMILARITY) continue;

    indices.add(i);
  }

  return indices;
}
