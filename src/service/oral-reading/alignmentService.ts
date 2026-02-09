import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord } from "./whisperService"

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
  const GAP_PENALTY = -2

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  )

  for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_PENALTY
  for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_PENALTY

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const normalExpected = normalizeWord(passageWords[i - 1])
      const normalSpoken = normalizeWord(spokenWords[j - 1].word)

      const matchScore =
        normalExpected === normalSpoken ? MATCH_SCORE : MISMATCH_PENALTY

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
          (normalizeWord(passageWords[i - 1]) ===
          normalizeWord(spokenWords[j - 1].word)
            ? MATCH_SCORE
            : MISMATCH_PENALTY)
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
    // Tagalog: treat "ng" as single phoneme, "ñ" as single character
    const tokens: string[] = [];
    let i = 0;
    while (i < normalized.length) {
      if (
        i + 1 < normalized.length &&
        normalized[i] === "n" &&
        normalized[i + 1] === "g"
      ) {
        tokens.push("ng");
        i += 2;
      } else {
        tokens.push(normalized[i]);
        i++;
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
  const m = tokensA.length;
  const n = tokensB.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        tokensA[i - 1] === tokensB[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[m][n];
}

export function isReversal(expected: string, spoken: string): boolean {
  const a = normalizeWord(expected)
  const b = normalizeWord(spoken)
  return a.length > 1 && a === b.split("").reverse().join("")
}