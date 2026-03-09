import { TranscriptWord } from "@/types/oral-reading";
import { similarityRatio } from "@/utils/textUtils";

/**
 * Passage-guided correction using Smith-Waterman-style local alignment.
 */
export default function correctWithPassage(
  transcribedWords: TranscriptWord[],
  passageText: string,
  similarityThreshold = 0.55
): TranscriptWord[] {
  const passageWords = passageText
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (passageWords.length === 0 || transcribedWords.length === 0) {
    return transcribedWords;
  }

  const tLen = transcribedWords.length;
  const pLen = passageWords.length;

  const MATCH_BONUS = 2;
  const CLOSE_BONUS = 1;
  const GAP_PENALTY = -0.5;

  const dp: number[][] = Array.from({ length: tLen + 1 }, () =>
    Array(pLen + 1).fill(0)
  );
  const backtrack: number[][][] = Array.from({ length: tLen + 1 }, () =>
    Array(pLen + 1).fill([0, 0])
  );

  for (let i = 1; i <= tLen; i++) {
    dp[i][0] = i * GAP_PENALTY;
    backtrack[i][0] = [i - 1, 0];
  }
  for (let j = 1; j <= pLen; j++) {
    dp[0][j] = 0;
    backtrack[0][j] = [0, j - 1];
  }

  for (let i = 1; i <= tLen; i++) {
    for (let j = 1; j <= pLen; j++) {
      const sim = similarityRatio(transcribedWords[i - 1].word, passageWords[j - 1]);

      let matchScore: number;
      if (sim >= 0.85) {
        matchScore = dp[i - 1][j - 1] + MATCH_BONUS;
      } else if (sim >= similarityThreshold) {
        matchScore = dp[i - 1][j - 1] + CLOSE_BONUS;
      } else {
        matchScore = dp[i - 1][j - 1] - 1;
      }

      const skipTranscribed = dp[i - 1][j] + GAP_PENALTY;
      const skipPassage = dp[i][j - 1] + GAP_PENALTY;

      if (matchScore >= skipTranscribed && matchScore >= skipPassage) {
        dp[i][j] = matchScore;
        backtrack[i][j] = [i - 1, j - 1];
      } else if (skipTranscribed >= skipPassage) {
        dp[i][j] = skipTranscribed;
        backtrack[i][j] = [i - 1, j];
      } else {
        dp[i][j] = skipPassage;
        backtrack[i][j] = [i, j - 1];
      }
    }
  }

  let bestJ = 0;
  let bestScore = dp[tLen][0];
  for (let j = 1; j <= pLen; j++) {
    if (dp[tLen][j] >= bestScore) {
      bestScore = dp[tLen][j];
      bestJ = j;
    }
  }

  const correctionMap = new Map<number, string>();

  let ci = tLen;
  let cj = bestJ;

  while (ci > 0 && cj > 0) {
    const [pi, pj] = backtrack[ci][cj];

    if (pi === ci - 1 && pj === cj - 1) {
      const sim = similarityRatio(transcribedWords[ci - 1].word, passageWords[cj - 1]);
      if (sim >= similarityThreshold) {
        correctionMap.set(ci - 1, passageWords[cj - 1]);
      }
    }

    ci = pi;
    cj = pj;
  }

  return transcribedWords.map((w, idx) => {
    const corrected = correctionMap.get(idx);
    if (corrected) {
      return { ...w, word: corrected };
    }
    return w;
  });
}