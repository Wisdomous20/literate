import { AlignedWord} from "@/types/oral-reading";
import { normalizeWord, isSimilar } from "@/utils/textUtils";

export default function detectTranspositions(alignedWords: AlignedWord[]): {
  indices: Set<number>;
  pairs: Map<number, number>; // indexA → indexB
} {
  const indices = new Set<number>();
  const pairs = new Map<number, number>();
  const usedIndices = new Set<number>();

  // Adjacent MISMATCH swap
  for (let i = 0; i < alignedWords.length - 1; i++) {
    const a = alignedWords[i];
    const b = alignedWords[i + 1];

    if (
      a.match === "MISMATCH" && b.match === "MISMATCH" &&
      a.expected && a.spoken && b.expected && b.spoken
    ) {
      const ae = normalizeWord(a.expected);
      const as_ = normalizeWord(a.spoken);
      const be = normalizeWord(b.expected);
      const bs = normalizeWord(b.spoken);

      if (isSimilar(ae, bs) && isSimilar(be, as_)) {
        indices.add(i);
        indices.add(i + 1);
        pairs.set(i, i + 1);     // ✅ map A → B
        pairs.set(i + 1, i);     // ✅ map B → A
        usedIndices.add(i);
        usedIndices.add(i + 1);
      }
    }
  }

  // INSERTION + OMISSION window
  const WINDOW = 5;
  for (let i = 0; i < alignedWords.length; i++) {
    if (usedIndices.has(i)) continue;
    const a = alignedWords[i];
    if (a.match !== "INSERTION" || !a.spoken) continue;

    const spokenNorm = normalizeWord(a.spoken);

    for (let j = Math.max(0, i - WINDOW); j <= Math.min(alignedWords.length - 1, i + WINDOW); j++) {
      if (j === i || usedIndices.has(j)) continue;
      const b = alignedWords[j];
      if (b.match !== "OMISSION" || !b.expected) continue;

      const expectedNorm = normalizeWord(b.expected);
      if (spokenNorm === expectedNorm || isSimilar(a.spoken, b.expected)) {
        indices.add(i);
        indices.add(j);
        pairs.set(i, j);   // ✅ map A → B
        pairs.set(j, i);   // ✅ map B → A
        usedIndices.add(i);
        usedIndices.add(j);
        break;
      }
    }
  }

  return { indices, pairs };
}