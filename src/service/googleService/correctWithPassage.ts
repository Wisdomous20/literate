import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

/**
 * Passage-guided correction using Smith-Waterman-style local alignment.
 */
export default function correctWithPassage(
  transcribedWords: TranscriptWord[],
  passageText: string,
  similarityThreshold = 0.55
): TranscriptWord[] {
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

  const tLen = transcribedWords.length;
  const pLen = passageWords.length;

  // Pre-compute normalized words
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

  const dp: number[][] = Array.from({ length: tLen + 1 }, () =>
    Array(pLen + 1).fill(0)
  );
  const trace: Uint8Array[] = Array.from({ length: tLen + 1 }, () =>
    new Uint8Array(pLen + 1)
  );
  // 0 = zero/reset, 1 = diagonal, 2 = up, 3 = left

  let bestScore = 0;
  let bestI = 0;
  let bestJ = 0;

  for (let i = 1; i <= tLen; i++) {
    for (let j = 1; j <= pLen; j++) {
      const sim = simMatrix[i - 1][j - 1];
      const bonus = sim > 0.8 ? MATCH_BONUS : sim > similarityThreshold ? CLOSE_BONUS : -1;

      const diag = dp[i - 1][j - 1] + bonus;
      const up = dp[i - 1][j] + GAP_PENALTY;
      const left = dp[i][j - 1] + GAP_PENALTY;

      if (diag >= up && diag >= left && diag > 0) {
        dp[i][j] = diag;
        trace[i][j] = 1;
      } else if (up >= left && up > 0) {
        dp[i][j] = up;
        trace[i][j] = 2;
      } else if (left > 0) {
        dp[i][j] = left;
        trace[i][j] = 3;
      } else {
        dp[i][j] = 0;
        trace[i][j] = 0;
      }

      if (dp[i][j] > bestScore) {
        bestScore = dp[i][j];
        bestI = i;
        bestJ = j;
      }
    }
  }

  // Traceback to find matched pairs
  const corrections = new Map<number, string>();
  let ci = bestI;
  let cj = bestJ;

  while (ci > 0 && cj > 0 && dp[ci][cj] > 0) {
    if (trace[ci][cj] === 1) {
      const sim = simMatrix[ci - 1][cj - 1];
      if (sim > similarityThreshold && sim < 1.0) {
        corrections.set(ci - 1, passageWords[cj - 1]);
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

  return transcribedWords.map((w, idx) => {
    const corrected = corrections.get(idx);
    return corrected ? { ...w, word: corrected } : w;
  });
}