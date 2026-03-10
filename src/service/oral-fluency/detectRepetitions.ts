import { AlignedWord } from "@/types/oral-reading"
import { isSimilarForRepetition, normalizeWord } from "@/utils/textUtils";


export default function detectRepetitions(alignedWords: AlignedWord[]): Set<number> {
  const indices = new Set<number>()

  // === PASS 1: Adjacent repetition patterns ===
  for (let i = 0; i < alignedWords.length - 1; i++) {
    const a = alignedWords[i]
    const b = alignedWords[i + 1]

    // EXACT → INSERTION (student read word correctly, then said it again)
    if (
      a.match === "EXACT" &&
      b.match === "INSERTION" &&
      isSimilarForRepetition(a.expected, b.spoken)
    ) {
      indices.add(i + 1)
    }

    // EXACT → INSERTION (also check spoken vs spoken in case expected differs)
    if (
      a.match === "EXACT" &&
      b.match === "INSERTION" &&
      !indices.has(i + 1) &&
      isSimilarForRepetition(a.spoken, b.spoken)
    ) {
      indices.add(i + 1)
    }

    // MISMATCH → INSERTION (student mispronounced, then repeated the mispronunciation)
    if (
      a.match === "MISMATCH" &&
      b.match === "INSERTION" &&
      a.spoken &&
      b.spoken &&
      isSimilarForRepetition(a.spoken, b.spoken)
    ) {
      indices.add(i + 1)
    }

    // MISMATCH → INSERTION (insertion matches the expected word of the mismatch)
    if (
      a.match === "MISMATCH" &&
      b.match === "INSERTION" &&
      !indices.has(i + 1) &&
      a.expected &&
      b.spoken &&
      isSimilarForRepetition(a.expected, b.spoken)
    ) {
      indices.add(i + 1)
    }

    // INSERTION → INSERTION (stutter / repeated insertion)
    if (
      a.match === "INSERTION" &&
      b.match === "INSERTION" &&
      a.spoken &&
      b.spoken &&
      isSimilarForRepetition(a.spoken, b.spoken)
    ) {
      indices.add(i)
      indices.add(i + 1)
    }

    // INSERTION → EXACT where the inserted word matches the expected word that follows
    // Student said the word early, then said it again in its correct position
    if (
      a.match === "INSERTION" &&
      b.match === "EXACT" &&
      a.spoken &&
      b.expected &&
      isSimilarForRepetition(a.spoken, b.expected)
    ) {
      indices.add(i)
    }

    // INSERTION → EXACT (also check spoken vs spoken)
    if (
      a.match === "INSERTION" &&
      b.match === "EXACT" &&
      !indices.has(i) &&
      a.spoken &&
      b.spoken &&
      isSimilarForRepetition(a.spoken, b.spoken)
    ) {
      indices.add(i)
    }

    // EXACT → EXACT where both have the same expected word (alignment artifact)
    if (
      a.match === "EXACT" &&
      b.match === "EXACT" &&
      a.expected &&
      b.expected &&
      isSimilarForRepetition(a.expected, b.expected)
    ) {
      indices.add(i + 1)
    }

    // INSERTION → MISMATCH where insertion matches the expected word of the mismatch
    // Student said the word, alignment couldn't pair it, then tried again as a mismatch
    if (
      a.match === "INSERTION" &&
      b.match === "MISMATCH" &&
      a.spoken &&
      b.expected &&
      isSimilarForRepetition(a.spoken, b.expected)
    ) {
      indices.add(i)
    }
  }

  // === PASS 2: Non-adjacent look-back (INSERTION matches a nearby expected/spoken word) ===
  // Wider window (up to 5 words back) to handle cases where alignment inserts
  // omissions or other words between the original and the repetition
  for (let i = 0; i < alignedWords.length; i++) {
    if (indices.has(i)) continue

    const current = alignedWords[i]
    if (current.match !== "INSERTION" || !current.spoken) continue

    const currentNorm = normalizeWord(current.spoken)

    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const prev = alignedWords[j]

      // Skip omissions in the window — they don't represent spoken words
      if (prev.match === "OMISSION") continue

      // Check against expected word
      if (prev.expected) {
        const prevExpNorm = normalizeWord(prev.expected)
        if (prevExpNorm === currentNorm || isSimilarForRepetition(prev.expected, current.spoken)) {
          indices.add(i)
          break
        }
      }

      // Check against spoken word  
      if (prev.spoken) {
        const prevSpkNorm = normalizeWord(prev.spoken)
        if (prevSpkNorm === currentNorm || isSimilarForRepetition(prev.spoken, current.spoken)) {
          indices.add(i)
          break
        }
      }
    }
  }

  // === PASS 3: Forward look-ahead (INSERTION that matches an upcoming expected word) ===
  // Catches cases where the student says a word before reaching it in the passage
  for (let i = 0; i < alignedWords.length; i++) {
    if (indices.has(i)) continue

    const current = alignedWords[i]
    if (current.match !== "INSERTION" || !current.spoken) continue

    for (let j = i + 1; j <= Math.min(alignedWords.length - 1, i + 3); j++) {
      const next = alignedWords[j]

      if (next.match === "OMISSION") continue

      if (
        (next.match === "EXACT" || next.match === "MISMATCH") &&
        next.expected &&
        isSimilarForRepetition(current.spoken, next.expected)
      ) {
        indices.add(i)
        break
      }
    }
  }

  // === PASS 4: N-GRAM phrase repetition (any length) ===
  // Detects phrase repeats of any length (2+ words).
  // Builds spoken word sequences from contiguous INSERTIONs and matches
  // them against the expected/spoken words preceding the run.
  detectPhraseRepetitions(alignedWords, indices)

  // === PASS 5: Consecutive INSERTION run matching (fallback for long runs) ===
  detectLongInsertionRuns(alignedWords, indices)

  return indices
}

/**
 * Detect N-word phrase repetitions of any length.
 * 
 * Strategy: Find runs of consecutive INSERTION words. For each run of length L,
 * try all sub-sequences of length 2..L and check if they match a preceding
 * sequence of spoken/expected words.
 */
function detectPhraseRepetitions(
  alignedWords: AlignedWord[],
  indices: Set<number>
): void {
  // Collect all INSERTION runs
  let i = 0
  while (i < alignedWords.length) {
    // Find start of an INSERTION run (may include already-flagged ones)
    if (alignedWords[i].match !== "INSERTION" || !alignedWords[i].spoken) {
      i++
      continue
    }

    const runStart = i
    while (
      i < alignedWords.length &&
      alignedWords[i].match === "INSERTION" &&
      alignedWords[i].spoken
    ) {
      i++
    }
    const runEnd = i - 1
    const runLength = runEnd - runStart + 1

    if (runLength < 2) continue

    // Build the spoken phrase for this run
    const runSpoken: string[] = []
    for (let r = runStart; r <= runEnd; r++) {
      runSpoken.push(normalizeWord(alignedWords[r].spoken!))
    }

    // Try matching sub-phrases of decreasing length (greedy — longest first)
    let offset = 0
    while (offset < runLength) {
      let matched = false

      // Try phrase lengths from (runLength - offset) down to 2
      for (let phraseLen = runLength - offset; phraseLen >= 2; phraseLen--) {
        const phraseStart = runStart + offset
        const phraseEnd = phraseStart + phraseLen - 1

        if (phraseEnd > runEnd) continue

        const phrase = runSpoken.slice(offset, offset + phraseLen)

        // Search backward from phraseStart for a matching sequence
        const searchLimit = Math.max(0, phraseStart - phraseLen - 8)
        let foundMatch = false

        for (let s = phraseStart - 1; s >= searchLimit && !foundMatch; s--) {
          let matchCount = 0
          let si = s
          let pi = 0

          // Walk backward sequence trying to match phrase words
          while (si >= searchLimit && pi < phraseLen) {
            const candidate = alignedWords[si]

            // Skip OMISSIONs in the search window
            if (candidate.match === "OMISSION") {
              si--
              continue
            }

            const candidateWord = candidate.expected
              ? normalizeWord(candidate.expected)
              : candidate.spoken
                ? normalizeWord(candidate.spoken)
                : null

            if (!candidateWord) break

            // Match from the end of the phrase backward
            const phraseIdx = phraseLen - 1 - pi
            if (isSimilarForRepetition(phrase[phraseIdx], candidateWord)) {
              matchCount++
              pi++
              si--
            } else {
              break
            }
          }

          // Accept if we matched enough of the phrase
          if (matchCount >= Math.ceil(phraseLen * 0.6) && matchCount >= 2) {
            for (let r = phraseStart; r <= phraseEnd; r++) {
              indices.add(r)
            }
            foundMatch = true
          }
        }

        // Also try forward match: the phrase in the insertions matches
        // the expected words starting right after the run
        if (!foundMatch) {
          let matchCount = 0
          let ei = runEnd + 1
          let pi = 0

          while (ei < alignedWords.length && pi < phraseLen) {
            const candidate = alignedWords[ei]
            if (candidate.match === "OMISSION") {
              ei++
              continue
            }

            const candidateWord = candidate.expected
              ? normalizeWord(candidate.expected)
              : null

            if (!candidateWord) break

            if (isSimilarForRepetition(phrase[pi], candidateWord)) {
              matchCount++
              pi++
              ei++
            } else {
              break
            }
          }

          if (matchCount >= Math.ceil(phraseLen * 0.6) && matchCount >= 2) {
            for (let r = phraseStart; r <= phraseEnd; r++) {
              indices.add(r)
            }
            foundMatch = true
          }
        }

        if (foundMatch) {
          offset += phraseLen
          matched = true
          break
        }
      }

      if (!matched) {
        offset++
      }
    }
  }
}

/**
 * Detect long INSERTION runs that mirror the preceding EXACT/MISMATCH sequence.
 * Handles cases like: "Curiosity is one of the most" (EXACT×6) →
 * "Curiosity is one of the most" (INSERTION×6)
 */
function detectLongInsertionRuns(
  alignedWords: AlignedWord[],
  indices: Set<number>
): void {
  let runStart = 0
  while (runStart < alignedWords.length) {
    if (
      alignedWords[runStart].match !== "INSERTION" ||
      !alignedWords[runStart].spoken ||
      indices.has(runStart) // already handled
    ) {
      runStart++
      continue
    }

    // Find end of consecutive unflagged INSERTION run
    let runEnd = runStart
    while (
      runEnd + 1 < alignedWords.length &&
      alignedWords[runEnd + 1].match === "INSERTION" &&
      alignedWords[runEnd + 1].spoken &&
      !indices.has(runEnd + 1)
    ) {
      runEnd++
    }

    const runLength = runEnd - runStart + 1
    if (runLength < 2) {
      runStart = runEnd + 1
      continue
    }

    const runSpoken: string[] = []
    for (let r = runStart; r <= runEnd; r++) {
      runSpoken.push(normalizeWord(alignedWords[r].spoken!))
    }

    // Look backward from runStart for a matching sequence of spoken/expected words
    // Use a wider window to account for omissions and other alignment gaps
    const searchStart = Math.max(0, runStart - runLength - 10)
    let bestMatchCount = 0
    let bestMatchStart = -1

    for (let s = searchStart; s < runStart; s++) {
      let matchCount = 0
      let si = s
      let ri = 0

      while (si < runStart && ri < runLength) {
        const candidate = alignedWords[si]

        // Skip OMISSIONs
        if (candidate.match === "OMISSION") {
          si++
          continue
        }

        const candidateWord = candidate.expected
          ? normalizeWord(candidate.expected)
          : candidate.spoken
            ? normalizeWord(candidate.spoken)
            : null

        if (candidateWord && isSimilarForRepetition(runSpoken[ri], candidateWord)) {
          matchCount++
          ri++
          si++
        } else {
          // Allow skipping one word in either sequence for flexibility
          // but don't double-skip
          si++
          if (matchCount === 0) continue // haven't started matching yet
          break
        }
      }

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        bestMatchStart = s
      }
    }

    // Accept if we matched at least 50% of the run AND at least 2 words
    if (bestMatchCount >= Math.ceil(runLength * 0.5) && bestMatchCount >= 2) {
      for (let r = runStart; r <= runEnd; r++) {
        indices.add(r)
      }
    }

    runStart = runEnd + 1
  }
}