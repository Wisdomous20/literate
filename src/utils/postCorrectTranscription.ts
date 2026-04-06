import { editDistance } from "./textUtils";

export function postCorrectTranscription(
  transcribe: { word: string; start: number; end: number; confidence?: number }[],
  normalizedPassageWords: string[]
): { word: string; start: number; end: number; confidence?: number; correctedFrom?: string }[] {
  const passageSet = new Set(normalizedPassageWords);

  return transcribe.map((w) => {
    // Already matches a passage word — keep it
    if (passageSet.has(w.word)) return w;

    const confidence = w.confidence ?? 1.0;
    const isLowConfidence = confidence < 0.7;
    const isVeryLowConfidence = confidence < 0.4;
    const looksLikeNoise = w.word.length <= 2 || /(.)\1/.test(w.word);

    // High confidence + doesn't look like noise = trust it as a real miscue
    if (!looksLikeNoise && !isLowConfidence) return w;

    // Decide how aggressively to search for corrections
    // - Noise or very low confidence: allow edit distance up to 2
    // - Low confidence (but not very low): allow edit distance up to 2
    // - Just looks like noise but decent confidence: only edit distance 1
    const maxEditDist = (isLowConfidence || looksLikeNoise) ? 2 : 1;

    const candidates = [...passageSet].filter(
      (pw) => editDistance(w.word, pw) <= maxEditDist
    );

    // No candidates or ambiguous (multiple equally close) — keep original
    if (candidates.length === 0) return w;

    // If multiple candidates, pick the closest one
    if (candidates.length > 1) {
      // For very low confidence, pick the best match
      if (isVeryLowConfidence) {
        const best = candidates.reduce((a, b) =>
          editDistance(w.word, a) <= editDistance(w.word, b) ? a : b
        );
        // Only correct if there's a clear winner (unique minimum distance)
        const bestDist = editDistance(w.word, best);
        const tiedCount = candidates.filter(
          (c) => editDistance(w.word, c) === bestDist
        ).length;
        if (tiedCount === 1) {
          return { ...w, word: best, correctedFrom: w.word };
        }
      }
      return w; // ambiguous, keep original
    }

    return { ...w, word: candidates[0], correctedFrom: w.word };
  });
}