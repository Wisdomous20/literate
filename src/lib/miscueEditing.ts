import type { OralFluencyMiscue } from "@/types/assessment";
import type { MiscueResult } from "@/types/oral-reading";

type MiscueLike = Pick<
  MiscueResult,
  "wordIndex" | "miscueType" | "expectedWord" | "isSelfCorrected"
> & {
  spokenWord?: string | null;
};

function normalizeNullable(value: string | null | undefined) {
  return value ?? null;
}

export function sameMiscue(a: MiscueLike, b: MiscueLike) {
  return (
    a.wordIndex === b.wordIndex &&
    a.miscueType === b.miscueType &&
    a.expectedWord === b.expectedWord &&
    normalizeNullable(a.spokenWord) === normalizeNullable(b.spokenWord) &&
    a.isSelfCorrected === b.isSelfCorrected
  );
}

export function findMatchingDbMiscue(
  miscues: OralFluencyMiscue[],
  target: MiscueResult,
) {
  return miscues.find((miscue) => sameMiscue(miscue, target));
}

export function removeFirstMatchingMiscue(
  miscues: MiscueResult[],
  target: MiscueResult,
) {
  const index = miscues.findIndex((miscue) => sameMiscue(miscue, target));
  if (index === -1) {
    return miscues;
  }

  return miscues.filter((_, currentIndex) => currentIndex !== index);
}

export function updateFirstMatchingMiscueType(
  miscues: MiscueResult[],
  target: MiscueResult,
  newType: MiscueResult["miscueType"],
) {
  const index = miscues.findIndex((miscue) => sameMiscue(miscue, target));
  if (index === -1) {
    return miscues;
  }

  return miscues.map((miscue, currentIndex) =>
    currentIndex === index ? { ...miscue, miscueType: newType } : miscue,
  );
}

export function updateFirstMatchingSpokenWord(
  miscues: MiscueResult[],
  target: MiscueResult,
  newSpokenWord: string,
) {
  const index = miscues.findIndex((miscue) => sameMiscue(miscue, target));
  if (index === -1) {
    return miscues;
  }

  return miscues.map((miscue, currentIndex) =>
    currentIndex === index ? { ...miscue, spokenWord: newSpokenWord } : miscue,
  );
}
