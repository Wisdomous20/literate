
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,!?;:'""\u2018\u2019\u201C\u201D\u2014\u2013()[\]{}]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9'\-]/g, "")
    .trim();
}

// Keep this alias around so callers that imported normalizeWordStrict still
// compile, but it now points to the exact same function. Over time you can
// grep and replace all usages.
export const normalizeWordStrict = normalizeWord;


// ─── Tokenization ─────────────────────────────────────────────────────────────

/**
 * Tokenize a word into comparison units. For Tagalog, "ng" is treated as a
 * single digraph so that levenshtein counts it as one operation, not two.
 */
export function tokenizeForComparison(word: string, language: string): string[] {
  const normalized = normalizeWord(word);
  const lang = language.toLowerCase().trim();

  if (["tagalog", "tl", "filipino", "fil"].includes(lang)) {
    const tokens: string[] = [];
    let idx = 0;
    while (idx < normalized.length) {
      if (
        idx + 1 < normalized.length &&
        normalized[idx] === "n" &&
        normalized[idx + 1] === "g"
      ) {
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


// ─── Edit distance ────────────────────────────────────────────────────────────

/**
 * Levenshtein edit distance with language-aware tokenization.
 * This is the primary distance function used by similarityRatio.
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
 * Simple character-level edit distance. Used by postCorrectTranscription where
 * language-aware tokenization isn't needed.
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


// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Similarity ratio between two normalized strings (0–1). Language-aware.
 *
 * The old version had an early-exit shortcut that returned a rough length-ratio
 * estimate when lengths differed by more than 60%. That produced inconsistent
 * scores depending on which side was longer, which confused thresholds in the
 * correction and alignment layers. We now always compute the real edit distance
 * — it's trivially fast on typical word lengths (3–10 chars).
 */
export function similarityRatio(a: string, b: string, language: string = "en"): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const dist = levenshteinDistance(a, b, language);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

/**
 * Check if two words are similar above a threshold.
 */
export function isSimilar(
  a: string | null | undefined,
  b: string | null | undefined,
  threshold = 0.8
): boolean {
  if (!a || !b) return false;
  return similarityRatio(normalizeWord(a), normalizeWord(b)) >= threshold;
}

const REPETITION_SIMILARITY_THRESHOLD = 0.7;

export function isSimilarForRepetition(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
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