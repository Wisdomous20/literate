import { describe, expect, it } from "vitest";
import { detectMiscues } from "../miscueDetectionService";
import { AlignedWord } from "@/types/oral-reading";

function exact(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: word, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "EXACT" };
}

function omission(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: null, expectedIndex: idx, spokenIndex: null, timestamp: null, endTimestamp: null, confidence: null, match: "OMISSION" };
}

function insertion(word: string, idx: number): AlignedWord {
  return { expected: null, spoken: word, expectedIndex: null, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "INSERTION" };
}

function mismatch(expected: string, spoken: string, idx: number): AlignedWord {
  return { expected, spoken, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "MISMATCH" };
}

describe("detectMiscues", () => {
  it("returns an empty array when all words are exact matches", () => {
    const words = [exact("the", 0), exact("cat", 1), exact("sat", 2)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(0);
  });

  it("classifies a passage word with no spoken counterpart as OMISSION", () => {
    const words = [exact("the", 0), omission("cat", 1), exact("sat", 2)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(1);
    expect(result[0].miscueType).toBe("OMISSION");
    expect(result[0].expectedWord).toBe("cat");
    expect(result[0].spokenWord).toBeNull();
  });

  it("classifies an extra spoken word as INSERTION", () => {
    const words = [exact("the", 0), insertion("big", 1), exact("cat", 2)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(1);
    expect(result[0].miscueType).toBe("INSERTION");
    expect(result[0].spokenWord).toBe("big");
  });

  it("classifies a high-similarity mismatch as MISPRONUNCIATION", () => {
    // "kat" vs "cat" — edit distance 1, len 3, sim ≈ 0.67 ≥ 0.5 threshold
    const words = [mismatch("cat", "kat", 0)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(1);
    expect(result[0].miscueType).toBe("MISPRONUNCIATION");
    expect(result[0].expectedWord).toBe("cat");
    expect(result[0].spokenWord).toBe("kat");
  });

  it("classifies a low-similarity mismatch as SUBSTITUTION", () => {
    // "elephant" vs "the" — very low similarity < 0.5
    const words = [mismatch("the", "elephant", 0)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(1);
    expect(result[0].miscueType).toBe("SUBSTITUTION");
  });

  it("classifies a letter-reversal mismatch as REVERSAL", () => {
    // "was" ↔ "saw" is a classic reversal
    const words = [mismatch("was", "saw", 0)];

    const result = detectMiscues(words, "english");

    const reversals = result.filter((m) => m.miscueType === "REVERSAL");
    expect(reversals).toHaveLength(1);
    expect(reversals[0].expectedWord).toBe("was");
    expect(reversals[0].spokenWord).toBe("saw");
  });

  it("skips MISMATCH where normalised expected equals normalised spoken", () => {
    // Same word, different casing — normalizeWord makes them equal
    const words = [mismatch("The", "the", 0)];

    const result = detectMiscues(words, "english");

    expect(result).toHaveLength(0);
  });

  it("classifies adjacent INSERTION after EXACT where both words match as REPETITION", () => {
    // Student read "cat" correctly then said "cat" again
    const words = [exact("the", 0), exact("cat", 1), insertion("cat", 2), exact("sat", 3)];

    const result = detectMiscues(words, "english");

    const repetitions = result.filter((m) => m.miscueType === "REPETITION");
    expect(repetitions.length).toBeGreaterThan(0);
  });

  it("classifies adjacent MISMATCH swap as TRANSPOSITION", () => {
    // Passage: "big cat" — Student said: "cat big"
    const words = [mismatch("big", "cat", 0), mismatch("cat", "big", 1)];

    const result = detectMiscues(words, "english");

    const transpositions = result.filter((m) => m.miscueType === "TRANSPOSITION");
    expect(transpositions.length).toBeGreaterThan(0);
  });

  it("sets isSelfCorrected to false for ordinary miscues", () => {
    const words = [omission("cat", 0)];

    const result = detectMiscues(words, "english");

    expect(result[0].isSelfCorrected).toBe(false);
  });
});
