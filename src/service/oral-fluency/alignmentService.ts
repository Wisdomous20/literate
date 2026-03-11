import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

interface SpokenWordEntry {
  word: string
  start: number
  end: number
}

export function alignWords(
  passageWords: string[],
  spokenWords: SpokenWordEntry[]
): AlignedWord[] {
  const n = passageWords.length
  const m = spokenWords.length

  // Pre-compute normalized words to avoid redundant work in the DP loop
  const normExpected = passageWords.map(normalizeWord)
  const normSpoken = spokenWords.map((w) => normalizeWord(w.word))

  // Pre-compute similarity matrix (only compute once per pair)
  const simMatrix: number[][] = Array.from({ length: n }, () => Array(m).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      simMatrix[i][j] = similarityRatio(normExpected[i], normSpoken[j])
    }
  }

  const MATCH_SCORE = 2
  const MISMATCH_PENALTY = -1
  const GAP_PENALTY = -1.5

  function matchScore(i: number, j: number): number {
    const sim = simMatrix[i][j]
    // Exact match on short function words gets extra bonus to prevent misalignment
    if (sim === 1.0 && normExpected[i].length <= 3) return MATCH_SCORE + 1
    return sim > 0.8 ? MATCH_SCORE : sim > 0.4 ? MISMATCH_PENALTY / 2 : MISMATCH_PENALTY
  }

  // Use two-row DP + traceback matrix to reduce memory from O(n*m) numbers to O(n*m) bytes
  const trace: Uint8Array[] = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1))
  // 0 = diagonal, 1 = up (gap in spoken), 2 = left (gap in expected)

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))

  for (let i = 0; i <= n; i++) { dp[i][0] = i * GAP_PENALTY; trace[i][0] = 1; }
  for (let j = 0; j <= m; j++) { dp[0][j] = j * GAP_PENALTY; trace[0][j] = 2; }
  trace[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = dp[i - 1][j - 1] + matchScore(i - 1, j - 1)
      const up = dp[i - 1][j] + GAP_PENALTY
      const left = dp[i][j - 1] + GAP_PENALTY

      if (diag >= up && diag >= left) {
        dp[i][j] = diag
        trace[i][j] = 0
      } else if (up >= left) {
        dp[i][j] = up
        trace[i][j] = 1
      } else {
        dp[i][j] = left
        trace[i][j] = 2
      }
    }
  }

  // Traceback using pre-computed trace matrix (no re-computation)
  const aligned: AlignedWord[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && trace[i][j] === 0) {
      aligned.unshift({
        expected: passageWords[i - 1],
        spoken: spokenWords[j - 1].word,
        expectedIndex: i - 1,
        spokenIndex: j - 1,
        timestamp: spokenWords[j - 1].start,
        endTimestamp: spokenWords[j - 1].end,
        confidence: null,
        match: normExpected[i - 1] === normSpoken[j - 1] ? "EXACT" : "MISMATCH",
      })
      i--
      j--
    } else if (i > 0 && trace[i][j] === 1) {
      aligned.unshift({
        expected: passageWords[i - 1],
        spoken: null,
        expectedIndex: i - 1,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      })
      i--
    } else {
      aligned.unshift({
        expected: null,
        spoken: spokenWords[j - 1].word,
        expectedIndex: null,
        spokenIndex: j - 1,
        timestamp: spokenWords[j - 1].start,
        endTimestamp: spokenWords[j - 1].end,
        confidence: null,
        match: "INSERTION",
      })
      j--
    }
  }

  return aligned
}
export function tokenizeForComparison(
  word: string,
  language: string
): string[] {
  const normalized = normalizeWord(word);
  const lang = language.toLowerCase().trim();

  if (lang === "tagalog" || lang === "tl" || lang === "filipino" || lang === "fil") {
    const tokens: string[] = [];
    let idx = 0;
    while (idx < normalized.length) {
      if (
        idx + 1 < normalized.length &&
        normalized[idx] === "n" &&
        normalized[idx + 1] === "g"
      ) {
        tokens.push("ng");
        idx += 2;
      } else {
        tokens.push(normalized[idx]);
        idx++;
      }
    }
    return tokens;
  }

  return normalized.split("");
}

export function levenshteinDistance(
  a: string,
  b: string,
  language: string = "en"
): number {
  const tokensA = tokenizeForComparison(a, language);
  const tokensB = tokenizeForComparison(b, language);
  const mLen = tokensA.length;
  const nLen = tokensB.length;

  const dpArr: number[][] = Array.from({ length: mLen + 1 }, () =>
    Array(nLen + 1).fill(0)
  );

  for (let x = 0; x <= mLen; x++) dpArr[x][0] = x;
  for (let y = 0; y <= nLen; y++) dpArr[0][y] = y;

  for (let x = 1; x <= mLen; x++) {
    for (let y = 1; y <= nLen; y++) {
      dpArr[x][y] =
        tokensA[x - 1] === tokensB[y - 1]
          ? dpArr[x - 1][y - 1]
          : 1 + Math.min(dpArr[x - 1][y - 1], dpArr[x - 1][y], dpArr[x][y - 1]);
    }
  }

  return dpArr[mLen][nLen];
}