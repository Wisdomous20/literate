//  Corrects Whisper transcription words that are very close to expected passage words.
//  This catches common Whisper errors like "their" → "there", "two" → "to", etc.
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

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 999;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}