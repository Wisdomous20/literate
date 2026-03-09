
/**
 * Normalize a word for comparison — lowercase, keep only letters/ñ/apostrophes/hyphens.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-zñ']/g, "")
    .trim();
}

/**
 * Normalize a word with diacritic stripping (for passage ↔ transcription comparison).
 */
export function normalizeWordStrict(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,!?;:'""\u2018\u2019\u201C\u201D\u2014\u2013\-()[\]{}]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Tokenize a word for comparison, handling Tagalog "ng" digraph.
 */
export function tokenizeForComparison(word: string, language: string): string[] {
  const normalized = normalizeWord(word);
  const lang = language.toLowerCase().trim();

  if (["tagalog", "tl", "filipino", "fil"].includes(lang)) {
    const tokens: string[] = [];
    let idx = 0;
    while (idx < normalized.length) {
      if (idx + 1 < normalized.length && normalized[idx] === "n" && normalized[idx + 1] === "g") {
        tokens.push("ng");
        idx += 2;
      } else {
        tokens.push(normalized[idx]);
        idx++;
      }
    }
    return tokens;
  }

  return normalized.split("");
}

/**
 * Levenshtein edit distance (language-aware, handles Tagalog tokenization).
 */
export function levenshteinDistance(a: string, b: string, language: string = "en"): number {
  const tokensA = tokenizeForComparison(a, language);
  const tokensB = tokenizeForComparison(b, language);
  const mLen = tokensA.length;
  const nLen = tokensB.length;

  const dp: number[][] = Array.from({ length: mLen + 1 }, () => Array(nLen + 1).fill(0));
  for (let x = 0; x <= mLen; x++) dp[x][0] = x;
  for (let y = 0; y <= nLen; y++) dp[0][y] = y;

  for (let x = 1; x <= mLen; x++) {
    for (let y = 1; y <= nLen; y++) {
      dp[x][y] =
        tokensA[x - 1] === tokensB[y - 1]
          ? dp[x - 1][y - 1]
          : 1 + Math.min(dp[x - 1][y - 1], dp[x - 1][y], dp[x][y - 1]);
    }
  }

  return dp[mLen][nLen];
}

/**
 * Simple edit distance (no language tokenization). Used where language isn't relevant.
 */
export function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 999;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Similarity ratio between two strings (0–1). Language-aware.
 */
export function similarityRatio(a: string, b: string, language: string = "en"): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  // Quick length-based rejection: if lengths differ too much, similarity is low
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  if (minLen / maxLen < 0.4) return minLen / maxLen; // rough estimate, skip full edit distance

  const dist = levenshteinDistance(a, b, language);
  return 1 - dist / maxLen;
}

/**
 * Check if two words are similar above a threshold.
 */
export function isSimilar(a: string | null | undefined, b: string | null | undefined, threshold = 0.8): boolean {
  if (!a || !b) return false;
  return similarityRatio(normalizeWord(a), normalizeWord(b)) >= threshold;
}

const REPETITION_SIMILARITY_THRESHOLD = 0.7;

export function isSimilarForRepetition(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const normA = normalizeWord(a);
  const normB = normalizeWord(b);
  if (normA === normB) return true;
  return similarityRatio(normA, normB) >= REPETITION_SIMILARITY_THRESHOLD;
}

/**
 * Check if spoken word is a reversal of expected word.
 */
export function isReversal(expected: string, spoken: string): boolean {
  const a = normalizeWord(expected);
  const b = normalizeWord(spoken);
  return a.length > 1 && a === b.split("").reverse().join("");
}

export function isHyphenatedMatch(expected: string, spoken: string): boolean {
  if (!expected.includes("-")) return false;
  const parts = expected.toLowerCase().split("-");
  const normSpoken = normalizeWord(spoken);
  // Check if spoken matches any individual part
  if (parts.some((part) => normalizeWord(part) === normSpoken)) return true;
  // Check if the joined form matches
  if (parts.join("") === normSpoken) return true;
  return false;
}
