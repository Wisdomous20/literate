import { AlignedWord, MiscueResult } from "@/types/oral-reading"
import { normalizeWord } from "./whisperService"
import { levenshteinDistance, isReversal } from "./alignmentService"

export function similarityRatio(
  a: string,
  b: string,
  language: string = "en"
): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b, language) / maxLen;
}

function isSimilar(
  a: string | null | undefined,
  b: string | null | undefined,
  threshold = 0.8
) {
  if (!a || !b) return false

  return (
    similarityRatio(normalizeWord(a), normalizeWord(b)) >= threshold
  )
}

const MISPRONUNCIATION_THRESHOLD = 0.5

// Lower threshold specifically for repetition detection since Whisper
// may transcribe the same word slightly differently the second time
const REPETITION_SIMILARITY_THRESHOLD = 0.7

function isSimilarForRepetition(
  a: string | null | undefined,
  b: string | null | undefined
) {
  if (!a || !b) return false
  const normA = normalizeWord(a)
  const normB = normalizeWord(b)
  // Exact match after normalization is always a repetition
  if (normA === normB) return true
  return similarityRatio(normA, normB) >= REPETITION_SIMILARITY_THRESHOLD
}

function detectSelfCorrections(alignedWords: AlignedWord[], repetitionIndices: Set<number>): Set<number> {
  const indices = new Set<number>()

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const current = alignedWords[i]
    const next = alignedWords[i + 1]

    // Skip if either word is already marked as a repetition
    if (repetitionIndices.has(i) || repetitionIndices.has(i + 1)) continue;

    // Self-correction: student says wrong word (INSERTION) then says the correct word (EXACT)
    if (
      current.match === "INSERTION" &&
      next.match === "EXACT" &&
      current.spoken &&
      next.expected
    ) {
      const spokenNorm = normalizeWord(current.spoken)
      const expectedNorm = normalizeWord(next.expected)

      // If spoken and expected are too similar, it's a repetition, not a self-correction
      if (similarityRatio(spokenNorm, expectedNorm) > 0.8) continue;

      const sim = similarityRatio(spokenNorm, expectedNorm)
      if (sim > 0.3) indices.add(i)
    }

    // Self-correction: MISMATCH then INSERTION that matches the expected word
    if (
      current.match === "MISMATCH" &&
      next.match === "INSERTION" &&
      next.spoken &&
      current.expected
    ) {
      const sim = similarityRatio(
        normalizeWord(next.spoken),
        normalizeWord(current.expected)
      )
      if (sim > 0.8) indices.add(i)
    }
  }

  return indices
}

function detectTranspositions(alignedWords: AlignedWord[]): Set<number> {
  const indices = new Set<number>()

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const a = alignedWords[i]
    const b = alignedWords[i + 1]

    if (
      a.match === "MISMATCH" &&
      b.match === "MISMATCH" &&
      a.expected && a.spoken &&
      b.expected && b.spoken
    ) {
      const ae = normalizeWord(a.expected)
      const as_ = normalizeWord(a.spoken)
      const be = normalizeWord(b.expected)
      const bs = normalizeWord(b.spoken)

      if (isSimilar(ae, bs) && isSimilar(be, as_)) {
        indices.add(i)
        indices.add(i + 1)
      }
    }
  }

  return indices
}

function detectRepetitions(alignedWords: AlignedWord[]): Set<number> {
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

  return indices
}



export function detectMiscues(
  alignedWords: AlignedWord[],
  language: string
): MiscueResult[] {
  const miscues: MiscueResult[] = [];
  const repetitionIndices = detectRepetitions(alignedWords);
  const selfCorrectedIndices = detectSelfCorrections(alignedWords, repetitionIndices);
  const transposedIndices = detectTranspositions(alignedWords);

  for (let i = 0; i < alignedWords.length; i++) {
    const aligned = alignedWords[i];

    // Check repetition FIRST, before anything else — this prevents repetitions
    // from being misclassified as insertions
    if (repetitionIndices.has(i)) {
      miscues.push({
        miscueType: "REPETITION",
        expectedWord: aligned.expected ?? "",
        spokenWord: aligned.spoken,
        wordIndex: aligned.expectedIndex ?? aligned.spokenIndex ?? i,
        timestamp: aligned.timestamp,
        isSelfCorrected: false,
      });
      continue;
    }

    if (selfCorrectedIndices.has(i)) {
      miscues.push({
        miscueType: "SELF_CORRECTION",
        expectedWord: aligned.expected ?? aligned.spoken ?? "",
        spokenWord: aligned.spoken,
        wordIndex: aligned.expectedIndex ?? aligned.spokenIndex ?? i,
        timestamp: aligned.timestamp,
        isSelfCorrected: true,
      });
      continue;
    }

    if (transposedIndices.has(i)) {
      miscues.push({
        miscueType: "TRANSPOSITION",
        expectedWord: aligned.expected ?? "",
        spokenWord: aligned.spoken,
        wordIndex: aligned.expectedIndex ?? i,
        timestamp: aligned.timestamp,
        isSelfCorrected: false,
      });
      continue;
    }

    if (aligned.match === "EXACT") continue;

    if (aligned.match === "OMISSION") {
      miscues.push({
        miscueType: "OMISSION",
        expectedWord: aligned.expected!,
        spokenWord: null,
        wordIndex: aligned.expectedIndex!,
        timestamp: aligned.timestamp,
        isSelfCorrected: false,
      });
      continue;
    }

    if (aligned.match === "INSERTION") {
      miscues.push({
        miscueType: "INSERTION",
        expectedWord: "",
        spokenWord: aligned.spoken,
        wordIndex: aligned.spokenIndex ?? i,
        timestamp: aligned.timestamp,
        isSelfCorrected: false,
      });
      continue;
    }

    if (aligned.match === "MISMATCH" && aligned.expected && aligned.spoken) {
      const normExpected = normalizeWord(aligned.expected);
      const normSpoken = normalizeWord(aligned.spoken);

      if (isReversal(normExpected, normSpoken)) {
        miscues.push({
          miscueType: "REVERSAL",
          expectedWord: aligned.expected,
          spokenWord: aligned.spoken,
          wordIndex: aligned.expectedIndex ?? i,
          timestamp: aligned.timestamp,
          isSelfCorrected: false,
        });
        continue;
      }

      const sim = similarityRatio(normExpected, normSpoken, language);

      if (sim >= MISPRONUNCIATION_THRESHOLD) {
        miscues.push({
          miscueType: "MISPRONUNCIATION",
          expectedWord: aligned.expected,
          spokenWord: aligned.spoken,
          wordIndex: aligned.expectedIndex ?? i,
          timestamp: aligned.timestamp,
          isSelfCorrected: false,
        });
      } else {
        miscues.push({
          miscueType: "SUBSTITUTION",
          expectedWord: aligned.expected,
          spokenWord: aligned.spoken,
          wordIndex: aligned.expectedIndex ?? i,
          timestamp: aligned.timestamp,
          isSelfCorrected: false,
        });
      }
    }
  }

  return miscues;
}