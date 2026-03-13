import type { AlignedWord, MiscueResult } from "@/types/oral-reading"
import { similarityRatio, isSimilarForRepetition, isReversal, normalizeWord} from "@/utils/textUtils";
import detectSelfCorrections from "./detectSelfCorrections"
import detectTranspositions from "./detectTranspositions"
import detectRepetitions from "./detectRepetitions"

const MISPRONUNCIATION_THRESHOLD = 0.5

export function detectMiscues(
  alignedWords: AlignedWord[],
  language: string
): MiscueResult[] {
  const miscues: MiscueResult[] = [];
  const repetitionIndices = detectRepetitions(alignedWords);
  const selfCorrectedIndices = detectSelfCorrections(alignedWords, repetitionIndices);
  const transposedIndices = detectTranspositions(alignedWords);

  // const { data1, data2, data3 } = await Promise.all([
  //   function1(),
  //   function2(),
  //   function3()
  // ]);

  // Build a set of insertion indices that should be suppressed because they
  // are part of a repeated phrase (adjacent to or between repetition words)
  const suppressedInsertions = new Set<number>();
  for (const ri of repetitionIndices) {
    // Suppress INSERTION neighbours that form a contiguous repeated phrase
    // Look backward from the repetition index
    for (let k = ri - 1; k >= Math.max(0, ri - 3); k--) {
      if (alignedWords[k].match === "INSERTION" && !repetitionIndices.has(k)) {
        const spoken = alignedWords[k].spoken;
        if (spoken) {
          let isPartOfPhrase = false;
          for (let m = Math.max(0, k - 4); m < k; m++) {
            if (
              alignedWords[m].match !== "OMISSION" &&
              (isSimilarForRepetition(spoken, alignedWords[m].expected) ||
                isSimilarForRepetition(spoken, alignedWords[m].spoken))
            ) {
              isPartOfPhrase = true;
              break;
            }
          }
          if (isPartOfPhrase) suppressedInsertions.add(k);
        }
      } else {
        break;
      }
    }
    // Look forward from the repetition index
    for (let k = ri + 1; k <= Math.min(alignedWords.length - 1, ri + 3); k++) {
      if (alignedWords[k].match === "INSERTION" && !repetitionIndices.has(k)) {
        const spoken = alignedWords[k].spoken;
        if (spoken) {
          let isPartOfPhrase = false;
          for (let m = Math.max(0, k - 4); m < k; m++) {
            if (
              alignedWords[m].match !== "OMISSION" &&
              (isSimilarForRepetition(spoken, alignedWords[m].expected) ||
                isSimilarForRepetition(spoken, alignedWords[m].spoken))
            ) {
              isPartOfPhrase = true;
              break;
            }
          }
          if (isPartOfPhrase) suppressedInsertions.add(k);
        }
      } else {
        break;
      }
    }
  }

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

    // Skip insertions that are part of a detected repeated phrase
    if (suppressedInsertions.has(i)) {
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
      // For INSERTIONs flagged as self-correction, the reader was attempting
      // a nearby omitted/mismatched passage word — find it
      let expectedWord = aligned.expected ?? "";
      if (!expectedWord && aligned.spoken) {
        const spokenNorm = normalizeWord(aligned.spoken);
        for (let k = Math.max(0, i - 3); k <= Math.min(alignedWords.length - 1, i + 3); k++) {
          if (k === i) continue;
          const nearby = alignedWords[k];
          if ((nearby.match === "OMISSION" || nearby.match === "MISMATCH") && nearby.expected) {
            if (similarityRatio(spokenNorm, normalizeWord(nearby.expected)) > 0.5) {
              expectedWord = nearby.expected;
              break;
            }
          }
        }
      }

      miscues.push({
        miscueType: "SELF_CORRECTION",
        expectedWord: expectedWord || aligned.spoken || "",
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
      if (normalizeWord(aligned.expected) === normalizeWord(aligned.spoken)) continue;

      const normExpected = normalizeWord(aligned.expected);
      const normSpoken = normalizeWord(aligned.spoken);

      if (isReversal(aligned.expected, aligned.spoken)) {
        miscues.push({
          miscueType: "REVERSAL",
          expectedWord: aligned.expected,
          spokenWord: aligned.spoken,
          wordIndex: aligned.expectedIndex ?? i,
          timestamp: aligned.timestamp,
          isSelfCorrected: false,
        });
      } else {
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
  }

  return miscues;
}