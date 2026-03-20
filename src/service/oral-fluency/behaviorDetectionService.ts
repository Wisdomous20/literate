import { AlignedWord, BehaviorResult } from "@/types/oral-reading"
import { PitchAnalysis, isMonotonousPitch } from "./pitchAnalysisService"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimedWords(alignedWords: AlignedWord[]) {
  return alignedWords.filter(
    (w) => w.timestamp !== null && w.endTimestamp !== null && w.match !== "OMISSION"
  )
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function coV(arr: number[]): number {
  if (arr.length < 2) return 0
  const avg = mean(arr)
  if (avg === 0) return 0
  const stdDev = Math.sqrt(arr.reduce((s, x) => s + (x - avg) ** 2, 0) / arr.length)
  return stdDev / avg
}

// ─── Word-by-word reading ─────────────────────────────────────────────────────

function detectWordByWordReading(alignedWords: AlignedWord[]): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < 5) return []

  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }
  if (gaps.length < 4) return []

  const avgGap    = mean(gaps)
  const gapCov    = coV(gaps)
  const longRatio = gaps.filter(g => g > 0.35).length / gaps.length

  if (avgGap >= 0.40 && gapCov < 0.45 && longRatio > 0.60) {
    return [{
      behaviorType: "WORD_BY_WORD_READING",
      startIndex: timedWords[0].expectedIndex ?? 0,
      endIndex:   timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
      startTime:  timedWords[0].timestamp,
      endTime:    timedWords[timedWords.length - 1].endTimestamp,
      notes: `avgGap:${avgGap.toFixed(3)}s gapCoV:${gapCov.toFixed(3)} longRatio:${(longRatio * 100).toFixed(0)}%`,
    }]
  }
  return []
}

// ─── Monotonous reading ───────────────────────────────────────────────────────
//
// Strategy: Praat pitch CoV is the strongest single signal (2 votes).
// Three timing-derived signals each contribute 1 vote.
// Flag when total votes >= 3 (out of up to 5 possible).
//
// Signal A (pitch)  — pitchCoV < 0.15 → +2 votes  (flat F0 = no intonation)
// Signal B (timing) — content/function word duration ratio < 1.15 → +1 vote
// Signal C (timing) — sentence-final lengthening ratio < 1.30 → +1 vote
// Signal D (timing) — duration CoV < 0.28 → +1 vote
// Signal E (timing) — gap CoV < 0.45 → +1 vote

const FUNCTION_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "and","but","or","nor","for","so","yet",
  "in","on","at","to","with","by","from","of","into","onto","upon",
  "i","he","she","it","we","they","you","me","him","her","us","them",
  "my","his","its","our","their","your",
  "this","that","these","those",
  "do","does","did","have","has","had","will","would","can","could",
  "shall","should","may","might","must","ought",
  "not","no","than","as","if","then","else","when","while",
])

const SENTENCE_ENDING_RE = /[.!?][\"'\u2019\u201D\)\]]*$/

function detectMonotonousReading(
  alignedWords:        AlignedWord[],
  originalPassageWords: string[],
  pitchAnalysis:       PitchAnalysis | null,
): BehaviorResult[] {
  const timedWords = getTimedWords(alignedWords)
  if (timedWords.length < 6) return []

  let votes       = 0
  const maxVotes  = 5
  const details:  string[] = []

  // ── Signal A: Pitch CoV from Praat (strongest signal, worth 2 votes) ────
  if (pitchAnalysis && !pitchAnalysis.error && pitchAnalysis.voicedFrames >= 10) {
    const cov = pitchAnalysis.pitchCoV
    details.push(`pitchCoV:${cov.toFixed(4)}`)
    if (isMonotonousPitch(pitchAnalysis)) {
      votes += 2
      details.push("signal:flat-pitch(+2)")
    }
  } else {
    details.push("pitchCoV:unavailable")
  }

  // ── Signal B: Content/function word duration ratio ───────────────────────
  const contentDurs: number[] = []
  const funcDurs:    number[] = []

  for (const w of timedWords) {
    if (w.expectedIndex == null) continue
    const raw = (originalPassageWords[w.expectedIndex] ?? w.expected ?? "")
    const norm = raw.toLowerCase().replace(/[^a-z]/g, "")
    const dur  = w.endTimestamp! - w.timestamp!
    if (dur <= 0) continue
    ;(FUNCTION_WORDS.has(norm) ? funcDurs : contentDurs).push(dur)
  }

  if (contentDurs.length >= 2 && funcDurs.length >= 2) {
    const ratio = mean(contentDurs) / mean(funcDurs)
    details.push(`contentFuncRatio:${ratio.toFixed(3)}`)
    if (ratio < 1.15) {
      votes++
      details.push("signal:no-word-stress(+1)")
    }
  }

  // ── Signal C: Sentence-final lengthening ─────────────────────────────────
  const sentFinalDurs: number[] = []
  const otherDurs:     number[] = []

  for (const w of timedWords) {
    if (w.expectedIndex == null) continue
    const raw = (originalPassageWords[w.expectedIndex] ?? w.expected ?? "")
    const dur = w.endTimestamp! - w.timestamp!
    if (dur <= 0) continue
    ;(SENTENCE_ENDING_RE.test(raw) ? sentFinalDurs : otherDurs).push(dur)
  }

  if (sentFinalDurs.length >= 2 && otherDurs.length > 0) {
    const ratio = mean(sentFinalDurs) / mean(otherDurs)
    details.push(`sentFinalRatio:${ratio.toFixed(3)}`)
    if (ratio < 1.30) {
      votes++
      details.push("signal:no-sent-final-lengthening(+1)")
    }
  }

  // ── Signal D: Duration CoV ───────────────────────────────────────────────
  const allDurs = timedWords
    .map(w => w.endTimestamp! - w.timestamp!)
    .filter(d => d > 0)

  if (allDurs.length >= 6) {
    const durCov = coV(allDurs)
    details.push(`durCoV:${durCov.toFixed(3)}`)
    if (durCov < 0.28) {
      votes++
      details.push("signal:flat-word-durations(+1)")
    }
  }

  // ── Signal E: Gap CoV ────────────────────────────────────────────────────
  const gaps: number[] = []
  for (let i = 1; i < timedWords.length; i++) {
    const gap = timedWords[i].timestamp! - timedWords[i - 1].endTimestamp!
    if (gap >= 0) gaps.push(gap)
  }

  if (gaps.length >= 5) {
    const gapCov = coV(gaps)
    details.push(`gapCoV:${gapCov.toFixed(3)}`)
    if (gapCov < 0.45) {
      votes++
      details.push("signal:flat-gap-durations(+1)")
    }
  }

  // ── Decision: 3+ votes out of max 5 ─────────────────────────────────────
  if (votes < 3) return []

  return [{
    behaviorType: "MONOTONOUS_READING",
    startIndex: timedWords[0].expectedIndex ?? 0,
    endIndex:   timedWords[timedWords.length - 1].expectedIndex ?? timedWords.length - 1,
    startTime:  timedWords[0].timestamp,
    endTime:    timedWords[timedWords.length - 1].endTimestamp,
    notes: [`votes:${votes}/${maxVotes}`, ...details].join(" | "),
  }]
}

// ─── Dismissal of punctuation ─────────────────────────────────────────────────

const PAUSE_THRESHOLDS: Record<string, number> = {
  ".": 0.35,
  "!": 0.35,
  "?": 0.35,
  ",": 0.20,
  ";": 0.30,
  ":": 0.30,
}

function detectPunctuationDismissal(
  alignedWords:        AlignedWord[],
  originalPassageWords: string[],
): BehaviorResult[] {
  let dismissed = 0
  let total     = 0

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const curr = alignedWords[i]
    const next = alignedWords[i + 1]

    if (curr.endTimestamp == null || next.timestamp == null) continue
    if (curr.match === "OMISSION" || curr.expectedIndex == null) continue

    const originalWord = originalPassageWords[curr.expectedIndex]
    if (!originalWord) continue

    // Match trailing punctuation, allowing closing quotes/brackets after it
    const m = originalWord.match(/([.,!?;:])["'\u2019\u201D\)\]]*$/)
    if (!m) continue

    const threshold = PAUSE_THRESHOLDS[m[1]]
    if (threshold == null) continue

    total++
    if (next.timestamp - curr.endTimestamp < threshold) dismissed++
  }

  if (total < 3 || dismissed / total <= 0.50) return []

  return [{
    behaviorType: "DISMISSAL_OF_PUNCTUATION",
    startIndex: null,
    endIndex:   null,
    startTime:  null,
    endTime:    null,
    notes: `dismissed:${dismissed}/${total} (${Math.round((dismissed / total) * 100)}%)`,
  }]
}

// ─── Entry point ──────────────────────────────────────────────────────────────
//
// originalPassageWords: passageText.split(/\s+/).filter(w => w.length > 0)
//   — raw tokens BEFORE normalizeWord(), preserving punctuation
//
// pitchAnalysis: result of analyzePitch(audioBuffer) from praatPitchService
//   — pass null if Praat is unavailable; timing signals still work

export function detectBehaviors(
  alignedWords:         AlignedWord[],
  originalPassageWords: string[]         = [],
  pitchAnalysis:        PitchAnalysis | null = null,
): BehaviorResult[] {
  return [
    ...detectWordByWordReading(alignedWords),
    ...detectMonotonousReading(alignedWords, originalPassageWords, pitchAnalysis),
    ...detectPunctuationDismissal(alignedWords, originalPassageWords),
  ]
}