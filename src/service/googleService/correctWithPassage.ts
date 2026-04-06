import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";
import mergeSplitWords from "./mergeSplitWords";

const MORPHOLOGICAL_SUFFIXES = ["s", "es", "ed", "ing", "er", "est", "ly", "d"];

function isMorphologicalVariant(transcribedNorm: string, passageNorm: string): boolean {
  return MORPHOLOGICAL_SUFFIXES.some(
    (suffix) =>
      transcribedNorm === passageNorm + suffix ||
      passageNorm === transcribedNorm + suffix
  );
}

// ── Double Metaphone (lightweight) ────────────────────────
// Produces phonetic codes so homophones like "are"/"our",
// "there"/"their", "or"/"our" resolve correctly.

function doubleMetaphone(word: string): [string, string] {
  const w = word.toUpperCase();
  let primary = "";
  let secondary = "";
  let pos = 0;
  const len = w.length;

  const charAt = (i: number) => (i >= 0 && i < len ? w[i] : "");
  const isVowel = (c: string) => "AEIOUY".includes(c);

  if (["GN", "KN", "PN", "AE", "WR"].includes(w.slice(0, 2))) pos = 1;

  while (pos < len && primary.length < 4) {
    const c = charAt(pos);
    const next = charAt(pos + 1);

    if (isVowel(c)) {
      if (pos === 0) { primary += "A"; secondary += "A"; }
      pos++;
      continue;
    }

    switch (c) {
      case "B":
        primary += "P"; secondary += "P";
        pos += next === "B" ? 2 : 1;
        break;
      case "C":
        if (next === "H") { primary += "X"; secondary += "X"; pos += 2; }
        else if ("EIY".includes(next)) { primary += "S"; secondary += "S"; pos += 2; }
        else { primary += "K"; secondary += "K"; pos += next === "C" ? 2 : 1; }
        break;
      case "D":
        if (next === "G" && "EIY".includes(charAt(pos + 2))) {
          primary += "J"; secondary += "J"; pos += 3;
        } else { primary += "T"; secondary += "T"; pos += next === "D" ? 2 : 1; }
        break;
      case "F":
        primary += "F"; secondary += "F"; pos += next === "F" ? 2 : 1;
        break;
      case "G":
        if (next === "H") {
          if (pos > 0 && !isVowel(charAt(pos - 1))) { pos += 2; }
          else { primary += "K"; secondary += "K"; pos += 2; }
        } else if ("EIY".includes(next)) {
          primary += "J"; secondary += "K"; pos += 2;
        } else {
          primary += "K"; secondary += "K"; pos += next === "G" ? 2 : 1;
        }
        break;
      case "H":
        if (isVowel(next) && (pos === 0 || !isVowel(charAt(pos - 1)))) {
          primary += "H"; secondary += "H";
        }
        pos++;
        break;
      case "J":
        primary += "J"; secondary += "H"; pos++;
        break;
      case "K":
        primary += "K"; secondary += "K"; pos += next === "K" ? 2 : 1;
        break;
      case "L":
        primary += "L"; secondary += "L"; pos += next === "L" ? 2 : 1;
        break;
      case "M":
        primary += "M"; secondary += "M"; pos += next === "M" ? 2 : 1;
        break;
      case "N":
        primary += "N"; secondary += "N"; pos += next === "N" ? 2 : 1;
        break;
      case "P":
        if (next === "H") { primary += "F"; secondary += "F"; pos += 2; }
        else { primary += "P"; secondary += "P"; pos += next === "P" ? 2 : 1; }
        break;
      case "Q":
        primary += "K"; secondary += "K"; pos += next === "U" ? 2 : 1;
        break;
      case "R":
        primary += "R"; secondary += "R"; pos += next === "R" ? 2 : 1;
        break;
      case "S":
        if (next === "H") { primary += "X"; secondary += "X"; pos += 2; }
        else if (next === "I" && "AO".includes(charAt(pos + 2))) {
          primary += "S"; secondary += "X"; pos += 3;
        } else { primary += "S"; secondary += "S"; pos += next === "S" ? 2 : 1; }
        break;
      case "T":
        if (next === "H") { primary += "0"; secondary += "T"; pos += 2; }
        else if (next === "I" && "AO".includes(charAt(pos + 2))) {
          primary += "X"; secondary += "X"; pos += 3;
        } else { primary += "T"; secondary += "T"; pos += next === "T" ? 2 : 1; }
        break;
      case "V":
        primary += "F"; secondary += "F"; pos += next === "V" ? 2 : 1;
        break;
      case "W":
      case "Y":
        if (isVowel(next)) { primary += c; secondary += c; }
        pos++;
        break;
      case "X":
        primary += "KS"; secondary += "KS"; pos += next === "X" ? 2 : 1;
        break;
      case "Z":
        primary += "S"; secondary += "S"; pos += next === "Z" ? 2 : 1;
        break;
      default:
        pos++;
    }
  }

  return [primary.slice(0, 4), secondary.slice(0, 4)];
}

function phoneticallyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === 0 || b.length === 0) return false;
  const [pA1, pA2] = doubleMetaphone(a);
  const [pB1, pB2] = doubleMetaphone(b);
  return (
    (pA1.length > 0 && (pA1 === pB1 || pA1 === pB2)) ||
    (pA2.length > 0 && (pA2 === pB1 || pA2 === pB2))
  );
}

/**
 * Combined similarity: max of string similarity and phonetic match.
 * Phonetic match returns 0.9 so homophones like are/our get paired
 * by the alignment but can still be corrected.
 */
function combinedSimilarity(a: string, b: string): number {
  const stringSim = similarityRatio(a, b);
  if (stringSim >= 0.9) return stringSim;

  if (phoneticallyMatch(a, b)) {
    return Math.max(stringSim, 0.9);
  }

  return stringSim;
}

/**
 * Passage-guided correction using Smith-Waterman-style local alignment.
 * Only corrects obvious STT noise — preserves real miscues including
 * morphological variants (e.g. "understands" vs "understand").
 *
 * Uses phonetic matching (Double Metaphone) so homophones like
 * "are"/"our", "there"/"their" get corrected to the passage word.
 */
export default function correctWithPassage(
  transcribedWords: TranscriptWord[],
  passageText: string,
  similarityThreshold = 0.55
): TranscriptWord[] {
  const expandedPassageText = passageText.replace(
    /(\p{L})-(\p{L})/gu,
    "$1 $2"
  );
  const passageWords = expandedPassageText
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (passageWords.length === 0 || transcribedWords.length === 0) {
    return transcribedWords;
  }

  transcribedWords = mergeSplitWords(transcribedWords, passageWords);

  const tLen = transcribedWords.length;
  const pLen = passageWords.length;

  const normTranscribed = transcribedWords.map((w) => normalizeWord(w.word));
  const normPassage = passageWords.map(normalizeWord);

  // Use combined similarity (string + phonetic) for the alignment matrix
  const simMatrix: number[][] = Array.from({ length: tLen }, () => Array(pLen).fill(0));
  for (let i = 0; i < tLen; i++) {
    for (let j = 0; j < pLen; j++) {
      simMatrix[i][j] = combinedSimilarity(normTranscribed[i], normPassage[j]);
    }
  }

  const MATCH_BONUS = 2;
  const CLOSE_BONUS = 1;
  const GAP_PENALTY = -0.5;

  const dp: number[][] = Array.from({ length: tLen + 1 }, () =>
    Array(pLen + 1).fill(0)
  );
  const trace: Uint8Array[] = Array.from({ length: tLen + 1 }, () =>
    new Uint8Array(pLen + 1)
  );

  let bestScore = 0;
  let bestI = 0;
  let bestJ = 0;

  for (let i = 1; i <= tLen; i++) {
    for (let j = 1; j <= pLen; j++) {
      const sim = simMatrix[i - 1][j - 1];
      const bonus = sim > 0.8 ? MATCH_BONUS : sim > similarityThreshold ? CLOSE_BONUS : -1;

      const diag = dp[i - 1][j - 1] + bonus;
      const up = dp[i - 1][j] + GAP_PENALTY;
      const left = dp[i][j - 1] + GAP_PENALTY;

      if (diag >= up && diag >= left && diag > 0) {
        dp[i][j] = diag;
        trace[i][j] = 1;
      } else if (up >= left && up > 0) {
        dp[i][j] = up;
        trace[i][j] = 2;
      } else if (left > 0) {
        dp[i][j] = left;
        trace[i][j] = 3;
      } else {
        dp[i][j] = 0;
        trace[i][j] = 0;
      }

      if (dp[i][j] > bestScore) {
        bestScore = dp[i][j];
        bestI = i;
        bestJ = j;
      }
    }
  }

  const corrections = new Map<number, string>();
  let ci = bestI;
  let cj = bestJ;

  while (ci > 0 && cj > 0 && dp[ci][cj] > 0) {
    if (trace[ci][cj] === 1) {
      const sim = simMatrix[ci - 1][cj - 1];
      const transcribedNorm = normTranscribed[ci - 1];
      const passageNorm = normPassage[cj - 1];

      if (
        sim > similarityThreshold &&
        transcribedNorm !== passageNorm
      ) {
        const isMorph = isMorphologicalVariant(transcribedNorm, passageNorm);
        const isPhoneticMatch = phoneticallyMatch(transcribedNorm, passageNorm);

        console.log(
          `[correction] "${transcribedNorm}" → "${passageNorm}" | sim: ${sim.toFixed(2)} | isMorph: ${isMorph} | phonetic: ${isPhoneticMatch}`
        );

        // Correct if:
        // 1. Phonetic match (homophones) — STT can't distinguish these,
        //    so trust the passage. e.g. "are"→"our", "there"→"their"
        // 2. High string similarity AND not a morphological variant —
        //    STT garbled the word. e.g. "beautful"→"beautiful"
        if (isPhoneticMatch || !isMorph) {
          corrections.set(ci - 1, passageWords[cj - 1]);
        }
      }

      ci--;
      cj--;
    } else if (trace[ci][cj] === 2) {
      ci--;
    } else if (trace[ci][cj] === 3) {
      cj--;
    } else {
      break;
    }
  }

  return transcribedWords.map((w, idx) => {
    const corrected = corrections.get(idx);
    return corrected ? { ...w, word: corrected } : w;
  });
}