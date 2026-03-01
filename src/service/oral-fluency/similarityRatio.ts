import { levenshteinDistance } from "./alignmentService";
import { normalizeWord } from "./whisperService";

const REPETITION_SIMILARITY_THRESHOLD = 0.7

export  function similarityRatio(
  a: string,
  b: string,
  language: string = "en"
): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b, language) / maxLen;
}

export  function isSimilar(
  a: string | null | undefined,
  b: string | null | undefined,
  threshold = 0.8
) {
  if (!a || !b) return false

  return (
    similarityRatio(normalizeWord(a), normalizeWord(b)) >= threshold
  )
}

export function isSimilarForRepetition(
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
