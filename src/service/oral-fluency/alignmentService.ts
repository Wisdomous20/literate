import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord, similarityRatio } from "@/utils/textUtils"

// The old file had its own copies of levenshteinDistance and
// tokenizeForComparison that duplicated textUtils.ts. Removed them.
// Now everything flows through the single source of truth in textUtils.

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

  const normExpected = passageWords.map(normalizeWord)
  const normSpoken = spokenWords.map((w) => normalizeWord(w.word))

  // Pre-compute similarity matrix so we only calculate each pair once
  const simMatrix: number[][] = Array.from({ length: n }, () => Array(m).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      simMatrix[i][j] = similarityRatio(normExpected[i], normSpoken[j])
    }
  }

  const MATCH_SCORE = 2
  const MISMATCH_PENALTY = -1
  const GAP_PENALTY = -1.5
  const POSITION_DRIFT_PENALTY = 0.05

  function positionPenalty(i: number, j: number): number {
    // Repeated/common words can create multiple globally valid alignments.
    // Prefer staying near the reading diagonal so the opening words do not
    // drift to a later repeated phrase and become false leading omissions.
    return Math.min(Math.abs(i - j), 4) * POSITION_DRIFT_PENALTY
  }

  function matchScore(i: number, j: number): number {
    const sim = simMatrix[i][j]
    const penalty = positionPenalty(i, j)

    // Exact match bonus for short function words - these are the words STT
    // most often gets wrong, so when we do get an exact match we want to
    // strongly anchor on it.
    if (sim === 1.0 && normExpected[i].length <= 3) return MATCH_SCORE + 1 - penalty

    // High similarity -> clean match
    if (sim > 0.8) return MATCH_SCORE - penalty

    // Medium-high similarity -> slight positive score to keep morphological
    // variants together e.g. "funs"->"fun", "flower"->"flowers"
    if (sim > 0.6) return 0.5 - penalty

    // Medium similarity -> small penalty
    if (sim > 0.4) return MISMATCH_PENALTY / 2 - penalty

    // Low similarity -> full penalty, prefer gap
    return MISMATCH_PENALTY - penalty
  }

  const trace: Uint8Array[] = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1))
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))

  for (let i = 0; i <= n; i++) { dp[i][0] = i * GAP_PENALTY; trace[i][0] = 1 }
  for (let j = 0; j <= m; j++) { dp[0][j] = j * GAP_PENALTY; trace[0][j] = 2 }
  trace[0][0] = 0

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
