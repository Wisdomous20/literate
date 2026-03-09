import { isSimilar } from "./similarityRatio"
import { AlignedWord } from "@/types/oral-reading"
import { normalizeWord } from "../googleService/googleSTTService"

export default function detectTranspositions(alignedWords: AlignedWord[]): Set<number> {
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

  const WINDOW = 5

  for (let i = 0; i < alignedWords.length; i++) {
    const a = alignedWords[i]
    if (a.match !== "INSERTION" || !a.spoken) continue

    const spokenNorm = normalizeWord(a.spoken)

    for (let j = Math.max(0, i - WINDOW); j <= Math.min(alignedWords.length - 1, i + WINDOW); j++) {
      if (j === i) continue
      const b = alignedWords[j]

      if (b.match !== "OMISSION" || !b.expected) continue

      const expectedNorm = normalizeWord(b.expected)

      if (spokenNorm === expectedNorm || isSimilar(a.spoken, b.expected)) {
        indices.add(i) // the INSERTION
        indices.add(j) // the OMISSION
        break
      }
    }
  }

  return indices
}
