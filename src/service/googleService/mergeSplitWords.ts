import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

/**
 * Merge fragmented STT tokens back into single words when they match a
 * passage word. For example, "under" + "stand" → "understand".
 *
 * Key improvement: added a positional constraint via estimatedPassagePos.
 * The old version scanned the entire passage for matches, which meant that
 * "under" + "stand" at transcript position 5 could match "understand" at
 * passage position 80. This caused false merges when the student was actually
 * saying two separate short words that happened to concatenate into a passage
 * word somewhere else. Now we only search within a ±20 word window around
 * the estimated current reading position.
 */
export default function mergeSplitWords(
  transcribedWords: TranscriptWord[],
  passageWords: string[],
  threshold = 0.8
): TranscriptWord[] {
  const passageNorm = passageWords.map((w) => normalizeWord(w));
  const passageSet = new Set(passageNorm);
  const merged: TranscriptWord[] = [];

  // Track estimated position in the passage. As we consume transcribed words,
  // we advance this estimate forward. It doesn't need to be exact — just
  // close enough to prevent merging against distant passage words.
  let estimatedPassagePos = 0;

  let i = 0;

  while (i < transcribedWords.length) {
    let didMerge = false;

    // Try 3-word merge first
    if (i + 2 < transcribedWords.length) {
      const combined = normalizeWord(
        transcribedWords[i].word + transcribedWords[i + 1].word + transcribedWords[i + 2].word
      );
      const matchIdx = findBestPassageMatch(combined, passageNorm, threshold, estimatedPassagePos);
      if (matchIdx !== -1 && !allMatchIndividually(transcribedWords, i, 3, passageSet)) {
        merged.push({
          word: passageWords[matchIdx],
          start: transcribedWords[i].start,
          end: transcribedWords[i + 2].end,
        });
        estimatedPassagePos = matchIdx + 1;
        i += 3;
        didMerge = true;
      }
    }

    // Try 2-word merge
    if (!didMerge && i + 1 < transcribedWords.length) {
      const combined = normalizeWord(
        transcribedWords[i].word + transcribedWords[i + 1].word
      );
      const matchIdx = findBestPassageMatch(combined, passageNorm, threshold, estimatedPassagePos);
      if (matchIdx !== -1 && !allMatchIndividually(transcribedWords, i, 2, passageSet)) {
        merged.push({
          word: passageWords[matchIdx],
          start: transcribedWords[i].start,
          end: transcribedWords[i + 1].end,
        });
        estimatedPassagePos = matchIdx + 1;
        i += 2;
        didMerge = true;
      }
    }

    if (!didMerge) {
      // Advance the position estimate: if this word matches a nearby passage
      // word, update our position tracker
      const wordNorm = normalizeWord(transcribedWords[i].word);
      const nearbyMatch = findExactNearby(wordNorm, passageNorm, estimatedPassagePos);
      if (nearbyMatch !== -1) {
        estimatedPassagePos = nearbyMatch + 1;
      } else {
        // No match found — just advance by one to keep moving forward
        estimatedPassagePos = Math.min(estimatedPassagePos + 1, passageNorm.length);
      }

      merged.push(transcribedWords[i]);
      i++;
    }
  }
  return merged;
}

const SEARCH_WINDOW = 20;

/**
 * Find the best matching passage word index within a positional window,
 * or -1 if none meets the threshold.
 */
function findBestPassageMatch(
  combined: string,
  passageNorm: string[],
  threshold: number,
  searchCenter: number
): number {
  let bestIdx = -1;
  let bestSim = threshold;

  const start = Math.max(0, searchCenter - SEARCH_WINDOW);
  const end = Math.min(passageNorm.length, searchCenter + SEARCH_WINDOW);

  for (let j = start; j < end; j++) {
    const sim = similarityRatio(combined, passageNorm[j]);
    if (sim >= bestSim) {
      bestSim = sim;
      bestIdx = j;
    }
  }
  return bestIdx;
}

/**
 * Find an exact match for a word near the expected position.
 * Used to keep the position tracker accurate.
 */
function findExactNearby(
  wordNorm: string,
  passageNorm: string[],
  searchCenter: number
): number {
  const start = Math.max(0, searchCenter - SEARCH_WINDOW);
  const end = Math.min(passageNorm.length, searchCenter + SEARCH_WINDOW);

  for (let j = start; j < end; j++) {
    if (passageNorm[j] === wordNorm) return j;
  }
  return -1;
}

/**
 * Returns true if ALL words in the range already individually exist in the
 * passage. If so, they're probably real separate words, not a split fragment.
 */
function allMatchIndividually(
  words: TranscriptWord[],
  startIdx: number,
  count: number,
  passageSet: Set<string>
): boolean {
  for (let k = 0; k < count; k++) {
    if (!passageSet.has(normalizeWord(words[startIdx + k].word))) {
      return false;
    }
  }
  return true;
}