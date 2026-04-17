import { describe, expect, it } from "vitest";
import detectTranspositions from "../detectTranspositions";
import { AlignedWord } from "@/types/oral-reading";

function mismatch(expected: string, spoken: string, idx: number): AlignedWord {
  return { expected, spoken, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "MISMATCH" };
}

function insertion(word: string, idx: number): AlignedWord {
  return { expected: null, spoken: word, expectedIndex: null, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "INSERTION" };
}

function omission(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: null, expectedIndex: idx, spokenIndex: null, timestamp: null, endTimestamp: null, confidence: null, match: "OMISSION" };
}

function exact(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: word, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "EXACT" };
}

describe("detectTranspositions", () => {
  it("returns empty indices and pairs when there are no transpositions", () => {
    const words = [exact("the", 0), exact("cat", 1), exact("sat", 2)];

    const { indices, pairs } = detectTranspositions(words);

    expect(indices.size).toBe(0);
    expect(pairs.size).toBe(0);
  });

  it("detects adjacent MISMATCH swap (student swapped two words)", () => {
    // Passage: "big cat" — Student said: "cat big"
    const words = [
      mismatch("big", "cat", 0),
      mismatch("cat", "big", 1),
    ];

    const { indices, pairs } = detectTranspositions(words);

    expect(indices.has(0)).toBe(true);
    expect(indices.has(1)).toBe(true);
    expect(pairs.get(0)).toBe(1);
    expect(pairs.get(1)).toBe(0);
  });

  it("does not flag adjacent MISMATCHes that are not swaps", () => {
    // Passage: "big cat" — Student said: "dog fish" — unrelated words
    const words = [
      mismatch("big", "dog", 0),
      mismatch("cat", "fish", 1),
    ];

    const { indices } = detectTranspositions(words);

    expect(indices.size).toBe(0);
  });

  it("detects INSERTION + OMISSION transposition within the search window", () => {
    // Student said "cat" (insertion at pos 2) but "cat" is omitted at pos 0 — within 5-word window
    const words = [
      omission("cat", 0),
      exact("sat", 1),
      insertion("cat", 2),
    ];

    const { indices, pairs } = detectTranspositions(words);

    expect(indices.has(0)).toBe(true);
    expect(indices.has(2)).toBe(true);
    expect(pairs.get(2)).toBe(0);
  });

  it("does not pair INSERTION + OMISSION when the words are unrelated", () => {
    const words = [
      omission("elephant", 0),
      exact("sat", 1),
      insertion("cat", 2),
    ];

    const { indices } = detectTranspositions(words);

    // "cat" and "elephant" are not similar — should not be flagged
    expect(indices.size).toBe(0);
  });

  it("does not pair INSERTION + OMISSION outside the 5-word window", () => {
    const words = [
      omission("cat", 0),
      exact("w1", 1),
      exact("w2", 2),
      exact("w3", 3),
      exact("w4", 4),
      exact("w5", 5),
      insertion("cat", 6), // 6 positions away — outside WINDOW=5
    ];

    const { indices } = detectTranspositions(words);

    expect(indices.size).toBe(0);
  });
});
