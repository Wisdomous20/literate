import { AlignedWord, BehaviorResult } from "@/types/oral-reading"

function getTimedWords(alignedWords: AlignedWord[]) {
  return alignedWords.filter(
    (w) => w.timestamp !== null && w.endTimestamp !== null && w.match !== "OMISSION"
  )
}

function detectWordByWordReading(alignedWords: AlignedWord[]): BehaviorResult[] {
  const behaviors: BehaviorResult[] = []
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < 6) return behaviors

  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }
  if (gaps.length === 0) return behaviors

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const stdDev = Math.sqrt(
    gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length
  )
  const gapCov = stdDev / avgGap
  const longPauseRatio = gaps.filter(g => g > 0.4).length / gaps.length

  if (
    avgGap >= 0.45 &&
    gapCov < 0.4 &&
    longPauseRatio > 0.7
  ) {
    behaviors.push({
      behaviorType: "WORD_BY_WORD_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex: timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
      startTime: timedWords[0].timestamp,
      endTime: timedWords[timedWords.length - 1].endTimestamp,
      notes: `Avg gap: ${avgGap.toFixed(3)}s, CoV: ${gapCov.toFixed(3)}, Long pause ratio: ${(longPauseRatio * 100).toFixed(1)}%`,
    })
  }

  return behaviors
}
 

function detectMonotonousReading(alignedWords: AlignedWord[]): BehaviorResult[] {
  const behaviors: BehaviorResult[] = []
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < 5) return behaviors

  const durations = timedWords.map((w) => w.endTimestamp! - w.timestamp!)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const stdDev = Math.sqrt(
    durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
  )
  const cov = avgDuration > 0 ? stdDev / avgDuration : 0

  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0
  const gapStdDev = gaps.length > 0
    ? Math.sqrt(gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length)
    : 0
  const gapCov = avgGap > 0 ? gapStdDev / avgGap : 0

  if (cov < 0.25 && gapCov < 0.4) {
    behaviors.push({
      behaviorType: "MONOTONOUS_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex: timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
      startTime: timedWords[0].timestamp,
      endTime: timedWords[timedWords.length - 1].endTimestamp,
      notes: `Duration CoV: ${cov.toFixed(3)}, Gap CoV: ${gapCov.toFixed(3)}`,
    })
  }

  return behaviors
}

function detectPunctuationDismissal(
  alignedWords: AlignedWord[]
): BehaviorResult[] {

  const behaviors: BehaviorResult[] = []

  const PAUSE_THRESHOLDS: Record<string, number> = {
    ".": 0.35,
    "!": 0.35,
    "?": 0.35,
    ",": 0.2,
    ";": 0.3,
    ":": 0.3,
  }

  let dismissed = 0
  let total = 0

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const curr = alignedWords[i]
    const next = alignedWords[i + 1]

    if (!curr.expected || curr.endTimestamp == null || next.timestamp == null) continue

    // extract punctuation from expected word
    const match = curr.expected.match(/[.,!?;:]$/)
    if (!match) continue

    const punct = match[0]
    const threshold = PAUSE_THRESHOLDS[punct]
    if (!threshold) continue

    total++

    const pause = next.timestamp - curr.endTimestamp

    if (pause < threshold) {
      dismissed++
    }
  }

  if (total > 0 && dismissed / total > 0.5) {
    behaviors.push({
      behaviorType: "DISMISSAL_OF_PUNCTUATION",
      startIndex: null,
      endIndex: null,
      startTime: null,
      endTime: null,
      notes: `Dismissed ${dismissed}/${total}`
    })
  }

  return behaviors
}


export function detectBehaviors(
  alignedWords: AlignedWord[],
): BehaviorResult[] {
  return [
    ...detectWordByWordReading(alignedWords),
    ...detectMonotonousReading(alignedWords),
    ...detectPunctuationDismissal(alignedWords),
  ]
}