import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

function minConfidence(...values: (number | undefined)[]): number | undefined {
  const defined = values.filter((v): v is number => v !== undefined);
  return defined.length > 0 ? Math.min(...defined) : undefined;
}

export default function mergeSplitWords(
  transcribedWords: TranscriptWord[],
  passageWords: string[],
  threshold = 0.8,
): TranscriptWord[] {
  const passageNorm = passageWords.map((w) => normalizeWord(w));
  const passageSet = new Set(passageNorm);
  const merged: TranscriptWord[] = [];
  let i = 0;

  while (i < transcribedWords.length) {
    let didMerge = false;

    // Try 3-word merge first
    if (i + 2 < transcribedWords.length) {
      const combined = normalizeWord(
        transcribedWords[i].word +
          transcribedWords[i + 1].word +
          transcribedWords[i + 2].word,
      );
      const matchIdx = findBestPassageMatch(combined, passageNorm, threshold);
      if (
        matchIdx !== -1 &&
        !allMatchIndividually(transcribedWords, i, 3, passageSet)
      ) {
        merged.push({
          word: passageWords[matchIdx],
          start: transcribedWords[i].start,
          end: transcribedWords[i + 2].end,
          confidence: minConfidence(
            transcribedWords[i].confidence,
            transcribedWords[i + 1].confidence,
            transcribedWords[i + 2].confidence,
          ),
        });
        i += 3;
        didMerge = true;
      }
    }

    // Try 2-word merge
    if (!didMerge && i + 1 < transcribedWords.length) {
      const combined = normalizeWord(
        transcribedWords[i].word + transcribedWords[i + 1].word,
      );
      const matchIdx = findBestPassageMatch(combined, passageNorm, threshold);
      if (
        matchIdx !== -1 &&
        !allMatchIndividually(transcribedWords, i, 2, passageSet)
      ) {
        merged.push({
          word: passageWords[matchIdx],
          start: transcribedWords[i].start,
          end: transcribedWords[i + 1].end,
          confidence: minConfidence(
            transcribedWords[i].confidence,
            transcribedWords[i + 1].confidence,
          ),
        });
        i += 2;
        didMerge = true;
      }
    }

    if (!didMerge) {
      merged.push(transcribedWords[i]);
      i++;
    }
  }
  return merged;
}

/**
 * Find the best matching passage word index, or -1 if none meets threshold.
 */
function findBestPassageMatch(
  combined: string,
  passageNorm: string[],
  threshold: number,
): number {
  let bestIdx = -1;
  let bestSim = threshold;
  for (let j = 0; j < passageNorm.length; j++) {
    const sim = similarityRatio(combined, passageNorm[j]);
    if (sim >= bestSim) {
      bestSim = sim;
      bestIdx = j;
    }
  }
  return bestIdx;
}

/**
 * Returns true if ALL words in the range already individually exist in the passage.
 * If so, they're probably real separate words, not a split fragment.
 */
function allMatchIndividually(
  words: TranscriptWord[],
  startIdx: number,
  count: number,
  passageSet: Set<string>,
): boolean {
  for (let k = 0; k < count; k++) {
    if (!passageSet.has(normalizeWord(words[startIdx + k].word))) {
      return false;
    }
  }
  return true;
}
