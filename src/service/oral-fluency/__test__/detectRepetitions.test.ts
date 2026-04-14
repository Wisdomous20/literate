import { describe, expect, it } from "vitest";
import detectRepetitions from "../detectRepetitions";
import { AlignedWord } from "@/types/oral-reading";

function exact(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: word, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "EXACT" };
}

function insertion(word: string, idx: number): AlignedWord {
  return { expected: null, spoken: word, expectedIndex: null, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "INSERTION" };
}

function mismatch(expected: string, spoken: string, idx: number): AlignedWord {
  return { expected, spoken, expectedIndex: idx, spokenIndex: idx, timestamp: idx * 0.5, endTimestamp: idx * 0.5 + 0.4, confidence: null, match: "MISMATCH" };
}

function omission(word: string, idx: number): AlignedWord {
  return { expected: word, spoken: null, expectedIndex: idx, spokenIndex: null, timestamp: null, endTimestamp: null, confidence: null, match: "OMISSION" };
}

describe("detectRepetitions", () => {
  it("returns an empty set when there are no repetitions", () => {
    const words = [exact("the", 0), exact("cat", 1), exact("sat", 2)];

    const result = detectRepetitions(words);

    expect(result.size).toBe(0);
  });

  it("detects EXACT → INSERTION where the insertion matches the exact word (adjacent repeat)", () => {
    // Student read "cat" correctly then said "cat" again as an insertion
    const words = [exact("the", 0), exact("cat", 1), insertion("cat", 2), exact("sat", 3)];

    const result = detectRepetitions(words);

    expect(result.has(2)).toBe(true);
  });

  it("detects INSERTION → INSERTION where both spoken words are similar (stutter)", () => {
    // Student repeated the same word twice as back-to-back insertions
    const words = [insertion("the", 0), insertion("the", 1), exact("cat", 2)];

    const result = detectRepetitions(words);

    expect(result.has(0)).toBe(true);
    expect(result.has(1)).toBe(true);
  });

  it("detects MISMATCH → INSERTION where the insertion matches the mismatch's spoken word", () => {
    const words = [mismatch("cat", "kat", 0), insertion("kat", 1), exact("sat", 2)];

    const result = detectRepetitions(words);

    expect(result.has(1)).toBe(true);
  });

  it("detects INSERTION → EXACT where the inserted word matches the next expected word (early read)", () => {
    // Student read "cat" a beat early, then read it again in position
    const words = [insertion("cat", 0), exact("cat", 1), exact("sat", 2)];

    const result = detectRepetitions(words);

    expect(result.has(0)).toBe(true);
  });

  it("detects EXACT → EXACT where both have the same expected word (alignment artifact)", () => {
    const words = [exact("the", 0), exact("the", 1), exact("cat", 2)];

    const result = detectRepetitions(words);

    expect(result.has(1)).toBe(true);
  });

  it("detects a non-adjacent repetition via the look-back pass (within 5 words)", () => {
    // INSERTION at index 4 repeats the expected word at index 1, 3 words back
    const words = [
      exact("the", 0),
      exact("cat", 1),
      omission("sat", 2),
      exact("on", 3),
      insertion("cat", 4),
    ];

    const result = detectRepetitions(words);

    expect(result.has(4)).toBe(true);
  });
});
