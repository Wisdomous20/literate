import { editDistance } from "./textUtils";

// Only corrects obvious STT noise (repeated chars, very short garbled tokens)
// Real words are preserved as legitimate miscues
export function postCorrectTranscription(
  trunscribe: { word: string; start: number; end: number }[],
  normalizedPassageWords: string[]
): { word: string; start: number; end: number; correctedFrom?: string }[] {
  const passageSet = new Set(normalizedPassageWords);

  return trunscribe.map((w) => {
    // Already matches a passage word — keep it
    if (passageSet.has(w.word)) return w;

    // If it looks like a real word, trust the STT — likely a genuine miscue
    const looksLikeNoise = w.word.length <= 2 || /(.)\1/.test(w.word);
    if (!looksLikeNoise) return w;

    // Find all passage words within edit distance 1
    const candidates = [...passageSet].filter(
      (pw) => editDistance(w.word, pw) === 1
    );

    // No candidates or ambiguous — keep original
    if (candidates.length !== 1) return w;

    return { ...w, word: candidates[0], correctedFrom: w.word };
  });
}