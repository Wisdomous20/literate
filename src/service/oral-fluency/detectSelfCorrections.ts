import { AlignedWord} from "@/types/oral-reading"
import { normalizeWord, similarityRatio } from "@/utils/textUtils";

export default function detectSelfCorrections(alignedWords: AlignedWord[], repetitionIndices: Set<number>): Set<number> {
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