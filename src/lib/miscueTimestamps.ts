import type { AlignedWord, MiscueResult } from "@/types/oral-reading";
import { normalizeWord } from "@/utils/textUtils";

function isUsableTimestamp(timestamp: number | null | undefined) {
  return timestamp !== null && timestamp !== undefined && Number.isFinite(timestamp);
}

function pickNearestTimestamp(
  candidates: AlignedWord[],
  miscue: MiscueResult,
): number | null {
  const withTimestamps = candidates.filter((candidate) =>
    isUsableTimestamp(candidate.timestamp),
  );

  if (withTimestamps.length === 0) return null;

  const ranked = [...withTimestamps].sort((left, right) => {
    const leftIndex =
      left.expectedIndex ?? left.spokenIndex ?? Number.MAX_SAFE_INTEGER;
    const rightIndex =
      right.expectedIndex ?? right.spokenIndex ?? Number.MAX_SAFE_INTEGER;

    return Math.abs(leftIndex - miscue.wordIndex) - Math.abs(rightIndex - miscue.wordIndex);
  });

  return ranked[0].timestamp ?? null;
}

function deriveTimestampFromAlignedWords(
  miscue: MiscueResult,
  alignedWords: AlignedWord[],
) {
  const exactExpectedMatches = alignedWords.filter(
    (word) => word.expectedIndex === miscue.wordIndex && isUsableTimestamp(word.timestamp),
  );
  if (exactExpectedMatches.length > 0) {
    return exactExpectedMatches[0].timestamp ?? null;
  }

  const exactSpokenMatches = alignedWords.filter(
    (word) => word.spokenIndex === miscue.wordIndex && isUsableTimestamp(word.timestamp),
  );
  if (
    (miscue.miscueType === "INSERTION" ||
      (miscue.miscueType === "REPETITION" && !miscue.expectedWord)) &&
    exactSpokenMatches.length > 0
  ) {
    return exactSpokenMatches[0].timestamp ?? null;
  }

  const normalizedExpected = normalizeWord(miscue.expectedWord);
  const normalizedSpoken = normalizeWord(miscue.spokenWord ?? "");

  if (normalizedSpoken) {
    const spokenCandidates = alignedWords.filter(
      (word) => normalizeWord(word.spoken ?? "") === normalizedSpoken,
    );
    const spokenTimestamp = pickNearestTimestamp(spokenCandidates, miscue);
    if (spokenTimestamp !== null) return spokenTimestamp;
  }

  if (normalizedExpected) {
    const expectedCandidates = alignedWords.filter(
      (word) => normalizeWord(word.expected ?? "") === normalizedExpected,
    );
    const expectedTimestamp = pickNearestTimestamp(expectedCandidates, miscue);
    if (expectedTimestamp !== null) return expectedTimestamp;
  }

  return null;
}

export function hydrateMiscueTimestamps(
  miscues: MiscueResult[] | undefined,
  alignedWords: AlignedWord[] | undefined,
) {
  if (!miscues?.length || !alignedWords?.length) return miscues ?? [];

  return miscues.map((miscue) => {
    const derivedTimestamp = deriveTimestampFromAlignedWords(miscue, alignedWords);
    if (derivedTimestamp === null) return miscue;

    const hasMissingTimestamp = !isUsableTimestamp(miscue.timestamp);
    const hasSuspiciousZeroTimestamp =
      miscue.timestamp === 0 && miscue.wordIndex > 0 && derivedTimestamp > 0;

    if (!hasMissingTimestamp && !hasSuspiciousZeroTimestamp) {
      return miscue;
    }

    return {
      ...miscue,
      timestamp: derivedTimestamp,
    };
  });
}
