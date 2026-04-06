import { TranscriptWord } from "@/types/oral-reading";
import { normalizeWord, similarityRatio } from "@/utils/textUtils";
import { protos } from "@google-cloud/speech";

// ── Double Metaphone (lightweight implementation) ──────────
// Produces phonetic codes so homophones like "are"/"our", "there"/"their" match.

function doubleMetaphone(word: string): [string, string] {
  const w = word.toUpperCase();
  let primary = "";
  let secondary = "";
  let pos = 0;
  const len = w.length;

  const charAt = (i: number) => (i >= 0 && i < len ? w[i] : "");
  const isVowel = (c: string) => "AEIOUY".includes(c);

  // Skip silent initial letters
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
        pos += charAt(pos + 1) === "B" ? 2 : 1;
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
  const [pA1, pA2] = doubleMetaphone(a);
  const [pB1, pB2] = doubleMetaphone(b);
  return pA1 === pB1 || pA1 === pB2 || pA2 === pB1 || pA2 === pB2;
}

// ── Alternative Selection ─────────────────────────────────

interface ScoredAlternative {
  alternativeIndex: number;
  words: protos.google.cloud.speech.v2.IWordInfo[];
  score: number;
}

/**
 * Given multiple recognition alternatives for a single result and the
 * expected passage words, score each alternative and return the words
 * from the best one.
 *
 * Scoring: for each transcribed word, find the best-matching passage word
 * in a local window (±5 positions from the word's index). Award:
 *   - 3 points for exact string match
 *   - 2 points for phonetic match (handles homophones)
 *   - 1 point for high similarity (>0.7)
 *   - 0 otherwise
 */
export function selectBestAlternative(
  alternatives: protos.google.cloud.speech.v2.ISpeechRecognitionAlternative[],
  passageWordsNorm: string[],
): protos.google.cloud.speech.v2.ISpeechRecognitionAlternative {
  if (alternatives.length <= 1) return alternatives[0];

  const WINDOW = 5;
  let bestAlt = alternatives[0];
  let bestScore = -1;

  for (const alt of alternatives) {
    if (!alt.words?.length) continue;

    let score = 0;
    for (let wi = 0; wi < alt.words.length; wi++) {
      const tWord = normalizeWord(alt.words[wi].word ?? "");
      if (!tWord) continue;

      // Search a local window in the passage for the best match
      let wordBestScore = 0;
      const searchStart = Math.max(0, wi - WINDOW);
      const searchEnd = Math.min(passageWordsNorm.length - 1, wi + WINDOW);

      for (let pi = searchStart; pi <= searchEnd; pi++) {
        const pWord = passageWordsNorm[pi];

        if (tWord === pWord) {
          wordBestScore = 3;
          break; // can't do better
        }

        if (phoneticallyMatch(tWord, pWord)) {
          wordBestScore = Math.max(wordBestScore, 2);
          continue;
        }

        const sim = similarityRatio(tWord, pWord);
        if (sim > 0.7) {
          wordBestScore = Math.max(wordBestScore, 1);
        }
      }

      score += wordBestScore;
    }

    // Normalize by word count so longer alternatives don't auto-win
    const normalizedScore = alt.words.length > 0 ? score / alt.words.length : 0;

    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestAlt = alt;
    }
  }

  return bestAlt;
}