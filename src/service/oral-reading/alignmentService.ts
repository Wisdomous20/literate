import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord } from "./whisperService"
import { similarityRatio } from "./miscueDetectionService"

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

  const MATCH_SCORE = 2
  const MISMATCH_PENALTY = -1
  const GAP_PENALTY = -1.5  // Less harsh gap penalty to prefer fuzzy matches over gaps

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  )

  for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_PENALTY
  for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_PENALTY

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const normalExpected = normalizeWord(passageWords[i - 1])
      const normalSpoken = normalizeWord(spokenWords[j - 1].word)

      const sim = similarityRatio(normalExpected, normalSpoken)

      const matchScore =
        sim > 0.8
          ? MATCH_SCORE
          : sim > 0.4
          ? MISMATCH_PENALTY / 2
          : MISMATCH_PENALTY

      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore,
        dp[i - 1][j] + GAP_PENALTY,
        dp[i][j - 1] + GAP_PENALTY
      )
    }
  }

  const aligned: AlignedWord[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] ===
        dp[i - 1][j - 1] +
          ((() => {
            const ne = normalizeWord(passageWords[i - 1])
            const ns = normalizeWord(spokenWords[j - 1].word)
            const s = similarityRatio(ne, ns)
            return s > 0.8
              ? MATCH_SCORE
              : s > 0.4
              ? MISMATCH_PENALTY / 2
              : MISMATCH_PENALTY
          })())
    ) {
      const normalExpected = normalizeWord(passageWords[i - 1])
      const normalSpoken = normalizeWord(spokenWords[j - 1].word)

      aligned.unshift({
        expected: passageWords[i - 1],
        spoken: spokenWords[j - 1].word,
        expectedIndex: i - 1,
        spokenIndex: j - 1,
        timestamp: spokenWords[j - 1].start,
        endTimestamp: spokenWords[j - 1].end,
        confidence: null,
        match: normalExpected === normalSpoken ? "EXACT" : "MISMATCH",
      })
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + GAP_PENALTY) {
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

export function isReversal(expected: string, spoken: string): boolean {
  const a = normalizeWord(expected)
  const b = normalizeWord(spoken)
  return a.length > 1 && a === b.split("").reverse().join("")
}