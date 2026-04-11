import { AlignedWord } from "@/types/oral-reading";
import { normalizeWord } from "@/utils/textUtils";
import { soundsSimilar } from "@/utils/phoneticUtils";

const MORPHOLOGICAL_SUFFIXES = ["s", "es", "ed", "ing", "er", "est", "ly", "d"];

/**
 * Simple morphological variant check. Returns true if one word is the other
 * plus a common English suffix. These are real reading errors and should NOT
 * be corrected even if they sound similar.
 */
function isMorphologicalVariant(a: string, b: string): boolean {
  if (a === b) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const diff = longer.length - shorter.length;
  if (diff > 4 || diff === 0) return false;

  if (longer.startsWith(shorter)) {
    const suffix = longer.slice(shorter.length);
    if (MORPHOLOGICAL_SUFFIXES.includes(suffix)) return true;
  }

  // Consonant doubling: run → running
  if (diff >= 3 && shorter.length >= 2) {
    const last = shorter[shorter.length - 1];
    if (longer[shorter.length] === last) {
      const tail = longer.slice(shorter.length + 1);
      if (["ing", "ed", "er", "est"].includes(tail)) return true;
    }
  }

  // E-dropping: make → making
  if (shorter.endsWith("e") && shorter.length >= 3) {
    const base = shorter.slice(0, -1);
    if (longer.startsWith(base)) {
      const tail = longer.slice(base.length);
      if (["ing", "ed", "er", "est"].includes(tail)) return true;
    }
  }

  return false;
}

/**
 * Post-process aligned words: for each MISMATCH, check if the spoken word
 * sounds similar to the expected passage word. If it does, correct the
 * spoken word to the passage word (making it EXACT).
 *
 * This is the approach you asked for:
 *   1. Alignment pairs spoken "these" with passage "this" as MISMATCH
 *   2. We ask: does "these" sound like "this"? (CMU dict says yes, sim=0.8)
 *   3. If yes → change spoken word to "this", mark as EXACT
 *
 * It scales to any passage with zero maintenance because it uses the CMU
 * dictionary (134,000 words) to compare actual pronunciation, not a
 * hand-maintained list.
 *
 * Returns a new aligned words array with corrections applied.
 */
export function phoneticPostCorrection(alignedWords: AlignedWord[]): AlignedWord[] {
  let correctionCount = 0;

  const result = alignedWords.map((aw) => {
    // Only process mismatches — exact, omission, insertion stay as-is
    if (aw.match !== "MISMATCH") return aw;
    if (!aw.spoken || !aw.expected) return aw;

    const spokenNorm = normalizeWord(aw.spoken);
    const expectedNorm = normalizeWord(aw.expected);

    // Already matching after normalization — shouldn't happen but guard it
    if (spokenNorm === expectedNorm) return aw;

    // Don't correct morphological variants — those are real reading errors
    if (isMorphologicalVariant(spokenNorm, expectedNorm)) return aw;

    // The key check: do these words sound similar enough that STT likely
    // just picked the wrong spelling?
    if (soundsSimilar(spokenNorm, expectedNorm)) {
      correctionCount++;
      console.log(
        `[phoneticPost] "${spokenNorm}" → "${expectedNorm}" (corrected to passage word)`
      );

      return {
        ...aw,
        spoken: aw.expected,   // replace with the passage word
        match: "EXACT" as const,
      };
    }

    return aw;
  });

  if (correctionCount > 0) {
    console.log(`[phoneticPostCorrection] Corrected ${correctionCount} mismatch(es)`);
  }

  return result;
}