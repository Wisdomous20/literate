import { AlignedWord, MiscueResult } from "@/types/oral-reading"
import { normalizeWord } from "../googleService/googleSTTService"
import {  isReversal } from "./alignmentService"
import { similarityRatio} from "./similarityRatio"
import detectSelfCorrections from "./detectSelfCorrections"
import detectTranspositions from "./detectTranspositions"
import detectRepetitions from "./detectRepetitions"
import { isSimilarForRepetition } from "./similarityRatio"

const MISPRONUNCIATION_THRESHOLD = 0.5

export function detectMiscues(
  alignedWords: AlignedWord[],
  language: string
): MiscueResult[] {
  const miscues: MiscueResult[] = [];
  const repetitionIndices = detectRepetitions(alignedWords);
  const selfCorrectedIndices = detectSelfCorrections(alignedWords, repetitionIndices);
  const transposedIndices = detectTranspositions(alignedWords);

  // Build a set of insertion indices that should be suppressed because they
  // are part of a repeated phrase (adjacent to or between repetition words)
  const suppressedInsertions = new Set<number>();
  for (const ri of repetitionIndices) {
    // Suppress INSERTION neighbours that form a contiguous repeated phrase
    // Look backward from the repetition index
    for (let k = ri - 1; k >= Math.max(0, ri - 3); k--) {
      if (alignedWords[k].match === "INSERTION" && !repetitionIndices.has(k)) {
        // Check if this insertion's spoken word matches a nearby expected/spoken word
        // (i.e., it's part of the same phrase repeat)
        const spoken = alignedWords[k].spoken;
        if (spoken) {
          // If the insertion is next to a repetition and itself looks like
          // a repeated word from the neighbourhood, suppress it
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
        break; // stop once we hit a non-insertion
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
      // Log as repetition instead of insertion
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