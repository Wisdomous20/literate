
let cmuDict: Record<string, string> | null = null;

async function loadDict(): Promise<Record<string, string>> {
  if (cmuDict) return cmuDict;
  try {
    const mod = await import("cmu-pronouncing-dictionary");
    cmuDict = mod.dictionary;
    console.log(`[phonetic] CMU dict loaded: ${Object.keys(cmuDict!).length} words`);
    return cmuDict!;
  } catch {
    console.warn("[phonetic] cmu-pronouncing-dictionary not installed");
    cmuDict = {};
    return cmuDict;
  }
}

/**
 * Pre-load the CMU dictionary. Call once at worker startup so all subsequent
 * lookups are synchronous and instant.
 */
export async function initPhoneticDict(): Promise<void> {
  await loadDict();
}

/**
 * Get the phoneme sequence for a word, with stress markers stripped.
 * Returns null if the word isn't in the CMU dictionary.
 */
export function getPhonemes(word: string): string[] | null {
  if (!cmuDict) return null;
  const entry = cmuDict[word.toLowerCase()];
  if (!entry) return null;
  return entry.replace(/[0-2]/g, "").split(" ").filter((p) => p.length > 0);
}


// ── Phoneme similarity groups ────────────────────────────────────────────────
//
// Phonemes in the same group sound close enough that STT systems, especially
// with children's voices or accented speech, frequently confuse them.
// Substituting one for another costs 0.3 instead of 1.0 in the edit distance.

const SIMILAR_PHONEMES: Record<string, string[]> = {
  // Front vowels
  IH: ["IY", "EH", "AH"],
  IY: ["IH", "EY"],
  EH: ["IH", "AE", "AH"],
  AE: ["EH", "AH"],

  // Central/back vowels
  AH: ["AE", "EH", "IH", "ER", "AA"],
  AA: ["AO", "AH", "AW"],
  AO: ["AA", "OW", "AW"],
  OW: ["AO", "UH"],
  UH: ["UW", "OW"],
  UW: ["UH"],
  AW: ["AA", "AO", "OW"],

  // R-colored
  ER: ["AH", "R", "EH"],

  // Diphthongs
  EY: ["IY", "EH"],
  AY: ["AH", "AA"],
  OY: ["OW", "AO"],

  // Voiced/voiceless consonant pairs
  S: ["Z"],
  Z: ["S"],
  T: ["D"],
  D: ["T"],
  P: ["B"],
  B: ["P"],
  K: ["G"],
  G: ["K"],
  F: ["V", "TH"],
  V: ["F", "DH"],

  // Dental/interdental
  TH: ["DH", "T", "F"],
  DH: ["TH", "D", "V"],

  // Sibilants
  SH: ["S", "ZH"],
  ZH: ["SH", "Z"],
  CH: ["SH", "JH"],
  JH: ["CH"],

  // Nasals
  N: ["M", "NG"],
  M: ["N"],
  NG: ["N"],

  // H is easily dropped/added in speech
  HH: [],
};

function areSimilarPhonemes(a: string, b: string): boolean {
  if (a === b) return true;
  return (
    SIMILAR_PHONEMES[a]?.includes(b) ||
    SIMILAR_PHONEMES[b]?.includes(a) ||
    false
  );
}


/**
 * Compute edit distance between two phoneme sequences using relaxed costs.
 * Similar phonemes cost 0.3 to substitute, H-drop costs 0.4, everything
 * else costs 1.0.
 */
function relaxedPhonemeDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        const similar = areSimilarPhonemes(a[i - 1], b[j - 1]);
        const hDrop = a[i - 1] === "HH" || b[j - 1] === "HH";
        const subCost = similar ? 0.3 : hDrop ? 0.4 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + subCost,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
        );
      }
    }
  }

  return dp[m][n];
}


/**
 * Check if two words sound similar enough that STT could plausibly confuse
 * them. Uses real CMU phoneme data with relaxed similarity scoring.
 *
 * Returns true for:
 *   - True homophones: there/their, know/no, right/write (sim = 1.0)
 *   - STT confusions: this/these (sim = 0.8), are/our (sim = 0.7)
 *
 * Returns false for:
 *   - Real substitutions: cat/bat, mother/father, house/home
 *   - Completely different words: big/large, run/walk
 *
 * The first-phoneme guard prevents false positives on minimal pairs like
 * cat/bat where only the initial consonant differs — those are real reading
 * errors, not STT confusions. STT confusions typically preserve the word
 * onset and differ in vowels or final consonants.
 */
export function soundsSimilar(wordA: string, wordB: string): boolean {
  const pa = getPhonemes(wordA);
  const pb = getPhonemes(wordB);

  // If either word isn't in CMU dict, we can't check phonetically
  if (!pa || !pb) return false;

  const dist = relaxedPhonemeDistance(pa, pb);
  const maxLen = Math.max(pa.length, pb.length);
  const phonSim = 1 - dist / maxLen;

  if (phonSim < 0.6) return false;

  // First-phoneme guard: if both words have 3+ phonemes and start with
  // completely dissimilar consonants, this is likely a real substitution
  // where the student started the word differently (cat→bat, mother→father).
  // STT confusions typically preserve the word onset.
  //
  // We skip this guard for short words (≤2 phonemes) because those have
  // too few phonemes for the onset to be meaningful.
  if (pa.length > 2 && pb.length > 2) {
    const first1 = pa[0];
    const first2 = pb[0];
    const hInvolved = first1 === "HH" || first2 === "HH";
    if (!hInvolved && !areSimilarPhonemes(first1, first2)) {
      return false;
    }
  }

  return true;
}


/**
 * Get the relaxed phonetic similarity score between two words (0–1).
 * Returns null if either word isn't in the CMU dictionary.
 */
export function getPhoneticSimilarity(wordA: string, wordB: string): number | null {
  const pa = getPhonemes(wordA);
  const pb = getPhonemes(wordB);
  if (!pa || !pb) return null;

  const dist = relaxedPhonemeDistance(pa, pb);
  const maxLen = Math.max(pa.length, pb.length);
  return maxLen > 0 ? 1 - dist / maxLen : 0;
}