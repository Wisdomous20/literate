import { editDistance } from "./textUtils";

//  Only corrects when the edit distance is ≤ 1 AND the word exists in the passage.
export function postCorrectTranscription(
  whisperWords: { word: string; start: number; end: number }[],
  normalizedPassageWords: string[]
): { word: string; start: number; end: number; correctedFrom?: string }[] {
  const passageSet = new Set(normalizedPassageWords);

  return whisperWords.map((w) => {
    // Already matches a passage word — keep it
    if (passageSet.has(w.word)) return w;

    // Check edit distance against all passage words
    for (const pw of passageSet) {
      if (editDistance(w.word, pw) === 1) {
        return { ...w, word: pw, correctedFrom: w.word };
      }
    }

    return w;
  });
}
