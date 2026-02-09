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

const MISPRONUNCIATION_THRESHOLD = 0.5

function detectSelfCorrections(alignedWords: AlignedWord[]): Set<number> {
  const indices = new Set<number>()

  for (let i = 0; i < alignedWords.length - 1; i++) {
    const current = alignedWords[i]
    const next = alignedWords[i + 1]

    if (
      current.match === "INSERTION" &&
      next.match === "EXACT" &&
      current.spoken &&
      next.expected
    ) {
      const sim = similarityRatio(
        normalizeWord(current.spoken),
        normalizeWord(next.expected)
      )
      if (sim > 0.3) indices.add(i)
    }

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
  const mismatches = alignedWords.filter(
    (w) =>
      w.match === "MISMATCH" &&
      w.expectedIndex !== null &&
      w.spokenIndex !== null
  )

  for (let i = 0; i < mismatches.length - 1; i++) {
    const a = mismatches[i]
    const b = mismatches[i + 1]

    if (
      a.expectedIndex !== null &&
      b.expectedIndex !== null &&
      b.expectedIndex === a.expectedIndex + 1 &&
      a.expected && b.expected && a.spoken && b.spoken
    ) {
      const e1 = normalizeWord(a.expected)
      const e2 = normalizeWord(b.expected)
      const s1 = normalizeWord(a.spoken)
      const s2 = normalizeWord(b.spoken)

      if (e1 === s2 && e2 === s1) {
        indices.add(a.expectedIndex)
        indices.add(b.expectedIndex)
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
  const selfCorrectedIndices = detectSelfCorrections(alignedWords);
  const transposedIndices = detectTranspositions(alignedWords);

  for (let i = 0; i < alignedWords.length; i++) {
    const aligned = alignedWords[i];

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

    if (aligned.match === "MISMATCH") {
      const expected = normalizeWord(aligned.expected!);
      const spoken = normalizeWord(aligned.spoken!);

      // Check transposition
      if (
        aligned.expectedIndex !== null &&
        transposedIndices.has(aligned.expectedIndex)
      ) {
        const pairIndices = Array.from(transposedIndices).filter(
          (idx) => Math.abs(idx - aligned.expectedIndex!) <= 1
        );
        const isFirst = aligned.expectedIndex === Math.min(...pairIndices);

        if (isFirst) {
          miscues.push({
            miscueType: "TRANSPOSITION",
            expectedWord: aligned.expected!,
            spokenWord: aligned.spoken,
            wordIndex: aligned.expectedIndex,
            timestamp: aligned.timestamp,
            isSelfCorrected: false,
          });
        }
        continue;
      }

      // Check reversal
      if (isReversal(expected, spoken)) {
        miscues.push({
          miscueType: "REVERSAL",
          expectedWord: aligned.expected!,
          spokenWord: aligned.spoken,
          wordIndex: aligned.expectedIndex!,
          timestamp: aligned.timestamp,
          isSelfCorrected: false,
        });
        continue;
      }

      // Mispronunciation vs Substitution 
      const sim = similarityRatio(expected, spoken, language);

      miscues.push({
        miscueType:
          sim >= MISPRONUNCIATION_THRESHOLD
            ? "MISPRONUNCIATION"
            : "SUBSTITUTION",
        expectedWord: aligned.expected!,
        spokenWord: aligned.spoken,
        wordIndex: aligned.expectedIndex!,
        timestamp: aligned.timestamp,
        isSelfCorrected: false,
      });
    }
  }

  return miscues;
}