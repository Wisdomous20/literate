import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord } from "../googleService/googleSTTService"
import { isSimilarForRepetition } from "./similarityRatio"


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
      isSimilarForRepetition(a.spoken, b.spoken)
    ) {
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

  // === PASS 4: BIGRAM repetition (phrase repeat) ===
  for (let i = 0; i < alignedWords.length - 1; i++) {
    const w1 = alignedWords[i]
    const w2 = alignedWords[i + 1]

    if (!w1.spoken || !w2.spoken) continue

    // At least one of the pair should be an INSERTION for this to be a repeated phrase
    if (w1.match !== "INSERTION" && w2.match !== "INSERTION") continue

    const bigram1 = `${normalizeWord(w1.spoken)} ${normalizeWord(w2.spoken)}`

    // Look back for same bigram
    for (let j = i - 2; j >= Math.max(0, i - 6); j--) {
      const p1 = alignedWords[j]
      const p2 = alignedWords[j + 1]

      if (!p1?.spoken || !p2?.spoken) continue

      const bigram2 = `${normalizeWord(p1.spoken)} ${normalizeWord(p2.spoken)}`

      if (bigram1 === bigram2) {
        indices.add(i)
        indices.add(i + 1)
        break
      }
    }
  }

    let runStart = 0;
  while (runStart < alignedWords.length) {
    // Find the start of a consecutive INSERTION run
    if (alignedWords[runStart].match !== "INSERTION" || !alignedWords[runStart].spoken) {
      runStart++;
      continue;
    }

    // Find the end of the run
    let runEnd = runStart;
    while (
      runEnd + 1 < alignedWords.length &&
      alignedWords[runEnd + 1].match === "INSERTION" &&
      alignedWords[runEnd + 1].spoken
    ) {
      runEnd++;
    }

    const runLength = runEnd - runStart + 1;

    // Only consider runs of 2+ words (single-word repetitions are handled by other passes)
    if (runLength >= 2) {
      const runSpoken = [];
      for (let r = runStart; r <= runEnd; r++) {
        runSpoken.push(normalizeWord(alignedWords[r].spoken!));
      }

      // Look backward from runStart for a matching sequence of spoken/expected words
      const searchStart = Math.max(0, runStart - runLength - 5);
      let foundMatch = false;

      for (let s = searchStart; s < runStart && !foundMatch; s++) {
        // Try to match the run starting from position s
        let matchCount = 0;
        let si = s;

        for (let ri = 0; ri < runSpoken.length && si < runStart; si++) {
          // Skip OMISSIONs in the search window
          if (alignedWords[si].match === "OMISSION") continue;

          const candidateWord =
            alignedWords[si].expected
              ? normalizeWord(alignedWords[si].expected!)
              : alignedWords[si].spoken
                ? normalizeWord(alignedWords[si].spoken!)
                : null;

          if (candidateWord && isSimilarForRepetition(runSpoken[ri], candidateWord)) {
            matchCount++;
            ri++;
          } else {
            break;
          }
        }

        // If we matched at least half the run (to be lenient with Whisper transcription),
        // mark the entire run as repetitions
        if (matchCount >= Math.ceil(runSpoken.length * 0.5) && matchCount >= 2) {
          for (let r = runStart; r <= runEnd; r++) {
            indices.add(r);
          }
          foundMatch = true;
        }
      }
    }

    runStart = runEnd + 1;
  }

  return indices
}