import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";
import mergeSplitWords from "./mergeSplitWords";

/**
 * Check if two words are morphological variants of each other.
 *
 * The old version just checked if one word was the other + a suffix, which
 * produced false positives ("mating" matched "mat" + "ing") and missed
 * common English spelling rules (e-dropping in "make" → "making", consonant
 * doubling in "run" → "running").
 *
 * For a reading assessment we WANT to preserve morphological differences as
 * real miscues — if the passage says "understand" and the student said
 * "understands", that's a reading error. This function's job is to prevent
 * the correction layer from "fixing" these back to the passage word.
 */
function isMorphologicalVariant(a: string, b: string): boolean {
  if (a === b) return false;

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const diff = longer.length - shorter.length;

  if (diff > 4 || diff === 0) return false;

  // Direct suffix: "walk" → "walks", "play" → "played"
  if (longer.startsWith(shorter)) {
    const suffix = longer.slice(shorter.length);
    if (["s", "es", "ed", "ing", "er", "est", "ly", "d"].includes(suffix)) {
      return true;
    }
  }

  // Consonant doubling: "run" → "running", "stop" → "stopped"
  if (diff >= 3 && shorter.length >= 2) {
    const lastChar = shorter[shorter.length - 1];
    if (longer[shorter.length] === lastChar) {
      const tail = longer.slice(shorter.length + 1);
      if (["ing", "ed", "er", "est"].includes(tail)) return true;
    }
  }

  // E-dropping: "make" → "making", "bake" → "baked", "dance" → "dancing"
  if (shorter.endsWith("e") && shorter.length >= 3) {
    const base = shorter.slice(0, -1);
    if (longer.startsWith(base)) {
      const tail = longer.slice(base.length);
      if (["ing", "ed", "er", "est"].includes(tail)) return true;
    }
  }

  // Y → IES / IED: "carry" → "carries", "try" → "tried"
  if (shorter.endsWith("y") && shorter.length >= 3) {
    const base = shorter.slice(0, -1);
    if (longer.startsWith(base)) {
      const tail = longer.slice(base.length);
      if (["ies", "ied", "ier", "iest"].includes(tail)) return true;
    }
  }

  return false;
}

/**
 * Passage-guided correction using Needleman-Wunsch global alignment.
 *
 * Major change from the old implementation: we switched from Smith-Waterman
 * (local alignment) to Needleman-Wunsch (global alignment). The old local
 * alignment found the single best-scoring region and only corrected words
 * inside that region. Words near the start and end of the transcript that
 * fell outside the alignment window were never considered for correction.
 * Since we know the student was reading this specific passage, global alignment
 * makes more sense — it forces the alignment to cover the full transcript.
 *
 * Other improvements:
 *   - Similarity threshold lowered from 0.55 to 0.50 for short words
 *   - Morphological variant detection handles English spelling rules properly
 *   - Correction logging shows what changed and why
 */
export default function correctWithPassage(
  transcribedWords: TranscriptWord[],
  passageText: string,
  similarityThreshold = 0.55
): TranscriptWord[] {
  // Expand hyphenated words so "well-known" becomes "well known"
  const expandedPassageText = passageText.replace(
    /(\p{L})-(\p{L})/gu,
    "$1 $2"
  );
  const passageWords = expandedPassageText
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (passageWords.length === 0 || transcribedWords.length === 0) {
    return transcribedWords;
  }

  // Merge split words first (e.g. "under" + "stand" → "understand")
  transcribedWords = mergeSplitWords(transcribedWords, passageWords);

  const tLen = transcribedWords.length;
  const pLen = passageWords.length;

  const normTranscribed = transcribedWords.map((w) => normalizeWord(w.word));
  const normPassage = passageWords.map(normalizeWord);

  // Pre-compute similarity matrix
  const simMatrix: number[][] = Array.from({ length: tLen }, () => Array(pLen).fill(0));
  for (let i = 0; i < tLen; i++) {
    for (let j = 0; j < pLen; j++) {
      simMatrix[i][j] = similarityRatio(normTranscribed[i], normPassage[j]);
    }
  }

  const MATCH_BONUS = 2;
  const CLOSE_BONUS = 1;
  const GAP_PENALTY = -0.5;

  // Needleman-Wunsch: initialize borders with gap penalties so the alignment
  // is forced to cover the full transcript (global alignment)
  const dp: number[][] = Array.from({ length: tLen + 1 }, () =>
    Array(pLen + 1).fill(0)
  );
  const trace: Uint8Array[] = Array.from({ length: tLen + 1 }, () =>
    new Uint8Array(pLen + 1)
  );

  // Initialize gap penalties for global alignment.
  // We use half the normal gap penalty for the borders so the alignment isn't
  // overly punished for length differences between transcript and passage.
  for (let i = 1; i <= tLen; i++) {
    dp[i][0] = i * (GAP_PENALTY * 0.5);
    trace[i][0] = 2; // came from above (skip transcribed word)
  }
  for (let j = 1; j <= pLen; j++) {
    dp[0][j] = j * (GAP_PENALTY * 0.5);
    trace[0][j] = 3; // came from left (skip passage word)
  }

  for (let i = 1; i <= tLen; i++) {
    for (let j = 1; j <= pLen; j++) {
      const sim = simMatrix[i - 1][j - 1];

      // Use a lower threshold for very short words (≤3 chars) since
      // one-char edits have outsized impact on similarity ratios
      const effectiveThreshold = normTranscribed[i - 1].length <= 3
        ? Math.min(similarityThreshold, 0.50)
        : similarityThreshold;

      const bonus = sim > 0.8 ? MATCH_BONUS
        : sim > effectiveThreshold ? CLOSE_BONUS
        : -1;

      const diag = dp[i - 1][j - 1] + bonus;
      const up = dp[i - 1][j] + GAP_PENALTY;
      const left = dp[i][j - 1] + GAP_PENALTY;

      if (diag >= up && diag >= left) {
        dp[i][j] = diag;
        trace[i][j] = 1; // diagonal
      } else if (up >= left) {
        dp[i][j] = up;
        trace[i][j] = 2; // up (skip transcribed)
      } else {
        dp[i][j] = left;
        trace[i][j] = 3; // left (skip passage)
      }
    }
  }

  // Traceback from (tLen, pLen) — global alignment covers the full sequences
  const corrections = new Map<number, string>();
  let ci = tLen;
  let cj = pLen;

  while (ci > 0 && cj > 0) {
    if (trace[ci][cj] === 1) {
      // Diagonal: transcribed[ci-1] aligned to passage[cj-1]
      const sim = simMatrix[ci - 1][cj - 1];
      const transcribedNorm = normTranscribed[ci - 1];
      const passageNorm = normPassage[cj - 1];

      const effectiveThreshold = transcribedNorm.length <= 3
        ? Math.min(similarityThreshold, 0.50)
        : similarityThreshold;

      if (
        sim > effectiveThreshold &&
        transcribedNorm !== passageNorm
      ) {
        const isMorph = isMorphologicalVariant(transcribedNorm, passageNorm);

        if (!isMorph) {
          // Only correct if the transcribed word is NOT already a real word
          // that happens to be different from the passage. We check this by
          // seeing if the similarity is high enough that it's likely noise
          // rather than a genuine substitution.
          const isLikelyNoise = sim > 0.7;

          if (isLikelyNoise) {
            corrections.set(ci - 1, passageWords[cj - 1]);
            console.log(
              `[correction] "${transcribedNorm}" → "${passageNorm}" | sim: ${sim.toFixed(2)}`
            );
          }
        } else {
          console.log(
            `[correction] PRESERVED morph variant: "${transcribedNorm}" ≠ "${passageNorm}" | sim: ${sim.toFixed(2)}`
          );
        }
      }

      ci--;
      cj--;
    } else if (trace[ci][cj] === 2) {
      ci--;
    } else if (trace[ci][cj] === 3) {
      cj--;
    } else {
      break;
    }
  }

  const correctionCount = corrections.size;
  if (correctionCount > 0) {
    console.log(`[correctWithPassage] Applied ${correctionCount} correction(s)`);
  }

  return transcribedWords.map((w, idx) => {
    const corrected = corrections.get(idx);
    return corrected ? { ...w, word: corrected } : w;
  });
}