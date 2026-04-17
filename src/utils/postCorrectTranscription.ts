import { editDistance } from "./textUtils";

/**
 * Post-correction pass that fixes obvious STT noise by matching against
 * known passage words using edit distance.
 *
 * Previously this had a "looksLikeNoise" gate that only corrected words
 * that were ≤2 chars or had repeated characters. That missed the most common
 * STT errors: real English words that happen to be wrong ("all" instead of
 * "old", "her" instead of "or", "make" instead of "makes"). The edit-distance-1
 * check with the single-candidate requirement is already conservative enough
 * to prevent false corrections without the noise gate.
 */
export function postCorrectTranscription(
  transcribed: { word: string; start: number; end: number }[],
  normalizedPassageWords: string[]
): { word: string; start: number; end: number; correctedFrom?: string }[] {
  const passageSet = new Set(normalizedPassageWords);

  return transcribed.map((w) => {
    // Already matches a passage word — keep it
    if (passageSet.has(w.word)) return w;

    // Find all passage words within edit distance 1. We only correct when
    // there's exactly one unambiguous candidate, so we won't turn a real
    // miscue like "house" into "horse" when both are in the passage.
    const candidates = [...passageSet].filter(
      (pw) => editDistance(w.word, pw) === 1
    );

    if (candidates.length !== 1) return w;

    return { ...w, word: candidates[0], correctedFrom: w.word };
  });
}