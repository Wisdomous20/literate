import { AlignedWord, BehaviorResult } from "@/types/oral-reading"

function getTimedWords(alignedWords: AlignedWord[]) {
  return alignedWords.filter(
    (w) => w.timestamp !== null && w.endTimestamp !== null && w.match !== "OMISSION"
  )
}

// ─── Word-by-word reading ─────────────────────────────────────────────────────
const WBW_MIN_WORDS      = 5
const WBW_MIN_AVG_GAP    = 0.40
const WBW_MAX_GAP_COV    = 0.45
const WBW_LONG_PAUSE_THR = 0.35
const WBW_MIN_LONG_RATIO = 0.60

function detectWordByWordReading(alignedWords: AlignedWord[]): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < WBW_MIN_WORDS) return []

  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }
  if (gaps.length < WBW_MIN_WORDS - 1) return []

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const stdDev = Math.sqrt(gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length)
  const gapCoV = avgGap > 0 ? stdDev / avgGap : 999
  const longPauseRatio = gaps.filter(g => g > WBW_LONG_PAUSE_THR).length / gaps.length

  if (avgGap >= WBW_MIN_AVG_GAP && gapCoV < WBW_MAX_GAP_COV && longPauseRatio > WBW_MIN_LONG_RATIO) {
    return [{
      behaviorType: "WORD_BY_WORD_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex: timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
      startTime: timedWords[0].timestamp,
      endTime: timedWords[timedWords.length - 1].endTimestamp,
      notes: `avgGap: ${avgGap.toFixed(3)}s | gapCoV: ${gapCoV.toFixed(3)} | longPauseRatio: ${(longPauseRatio * 100).toFixed(1)}%`,
    }]
  }
  return []
}

// ─── Monotonous reading ───────────────────────────────────────────────────────
const MONO_MIN_WORDS   = 8
const MONO_MAX_DUR_COV = 0.28
const MONO_MAX_GAP_COV = 0.45

function detectMonotonousReading(alignedWords: AlignedWord[]): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < MONO_MIN_WORDS) return []

  const durations = timedWords.map((w) => w.endTimestamp! - w.timestamp!)
  const avgDur = durations.reduce((a, b) => a + b, 0) / durations.length
  const durCoV = avgDur > 0
    ? Math.sqrt(durations.reduce((sum, d) => sum + (d - avgDur) ** 2, 0) / durations.length) / avgDur
    : 999

  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }

  let gapCoV = 0
  if (gaps.length > 0) {
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
    gapCoV = avgGap > 0
      ? Math.sqrt(gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length) / avgGap
      : 0
  }

  if (durCoV < MONO_MAX_DUR_COV && gapCoV < MONO_MAX_GAP_COV) {
    return [{
      behaviorType: "MONOTONOUS_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex: timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
      startTime: timedWords[0].timestamp,
      endTime: timedWords[timedWords.length - 1].endTimestamp,
      notes: `durationCoV: ${durCoV.toFixed(3)} | gapCoV: ${gapCoV.toFixed(3)}`,
    }]
  }
  return []
}

//
// ROOT CAUSE FIX: aligned.expected holds the *normalized* word (punctuation
// stripped by normalizeWord before alignment). We must look up punctuation from
// the *original* passage words array using aligned.expectedIndex.

const PAUSE_THRESHOLDS: Record<string, number> = {
  ".": 0.35,
  "!": 0.35,
  "?": 0.35,
  ",": 0.20,
  ";": 0.30,
  ":": 0.30,
}

const DISMISS_MIN_OPPORTUNITIES = 3
const DISMISS_RATIO = 0.50

// originalPassageWords must be the RAW split words before any normalizeWord call,
// e.g. ["The", "cat", "sat.", "He", "ran", "fast!"]
function detectPunctuationDismissal(
  alignedWords: AlignedWord[],
  originalPassageWords: string[]
): BehaviorResult[] {
  let dismissed = 0
  let total = 0

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const curr = alignedWords[i]
    const next = alignedWords[i + 1]

    if (curr.endTimestamp == null || next.timestamp == null) continue
    if (curr.match === "OMISSION" || curr.expectedIndex == null) continue

    // Look up the ORIGINAL word (with punctuation) by position
    const originalWord = originalPassageWords[curr.expectedIndex]
    if (!originalWord) continue

    // Match trailing punctuation, allowing closing quotes/parens after it
    // e.g. "said." "work?" "done!" "replied,"
    const trailingPunct = originalWord.match(/([.,!?;:])["'\u2019\u201D\)\]]*$/)
    if (!trailingPunct) continue

    const punct = trailingPunct[1]
    const threshold = PAUSE_THRESHOLDS[punct]
    if (threshold == null) continue

    total++

    const pause = next.timestamp - curr.endTimestamp
    if (pause < threshold) dismissed++
  }

  if (total < DISMISS_MIN_OPPORTUNITIES) return []

  if (dismissed / total > DISMISS_RATIO) {
    return [{
      behaviorType: "DISMISSAL_OF_PUNCTUATION",
      startIndex: null,
      endIndex: null,
      startTime: null,
      endTime: null,
      notes: `dismissed: ${dismissed}/${total} (${Math.round((dismissed / total) * 100)}%)`,
    }]
  }

  return []
}

// originalPassageWords: passageText.split(/\s+/).filter(w => w.length > 0)
// Pass this BEFORE normalizeWord is applied.

export function detectBehaviors(
  alignedWords: AlignedWord[],
  originalPassageWords: string[] = []
): BehaviorResult[] {
  return [
    ...detectWordByWordReading(alignedWords),
    ...detectMonotonousReading(alignedWords),
    ...detectPunctuationDismissal(alignedWords, originalPassageWords),
  ]
}