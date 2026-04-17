import { describe, expect, it } from "vitest";
import detectSelfCorrections from "../detectSelfCorrections";
import { AlignedWord } from "@/types/oral-reading";

function exact(word: string, ts: number, endTs: number): AlignedWord {
  return { expected: word, spoken: word, expectedIndex: 0, spokenIndex: 0, timestamp: ts, endTimestamp: endTs, confidence: null, match: "EXACT" };
}

function insertion(spoken: string, ts: number, endTs: number): AlignedWord {
  return { expected: null, spoken, expectedIndex: null, spokenIndex: 0, timestamp: ts, endTimestamp: endTs, confidence: null, match: "INSERTION" };
}

function mismatch(expected: string, spoken: string, ts: number, endTs: number): AlignedWord {
  return { expected, spoken, expectedIndex: 0, spokenIndex: 0, timestamp: ts, endTimestamp: endTs, confidence: null, match: "MISMATCH" };
}

function omission(word: string): AlignedWord {
  return { expected: word, spoken: null, expectedIndex: 0, spokenIndex: null, timestamp: null, endTimestamp: null, confidence: null, match: "OMISSION" };
}

describe("detectSelfCorrections", () => {
  it("returns an empty set when there are no corrections", () => {
    const words = [exact("the", 0, 0.3), exact("cat", 0.3, 0.6)];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag a word pair without a correction-range pause (0.5s–2.0s)", () => {
    // Gap of 0.1s is below the minimum 0.5s threshold
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      exact("cat", 0.4, 0.7), // gap = 0.1s — too short
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag a pair when the gap exceeds the maximum 2.0s correction window", () => {
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      exact("cat", 2.5, 2.8), // gap = 2.2s — too long
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("detects MISMATCH → EXACT as self-correction when the exact word matches the mismatch expected word", () => {
    // Reader said "bat", paused, then re-read "cat" correctly
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      exact("cat", 0.9, 1.2), // gap = 0.6s within correction window, same expected word → direct re-read
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
  });

  it("detects MISMATCH → INSERTION as self-correction when the insertion matches the expected word", () => {
    // Reader said "bat" for "cat", paused, then inserted "cat" as a correction
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      insertion("cat", 0.9, 1.2), // gap = 0.6s, "cat" ~= expected "cat" (sim 1.0 > 0.8)
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
  });

  it("skips a pair when either index is already in the repetition set", () => {
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      exact("cat", 0.9, 1.2),
    ];
    const repetitions = new Set([0]); // word 0 already classified as repetition

    const result = detectSelfCorrections(words, repetitions);

    expect(result.size).toBe(0);
  });

  it("skips pairs with no timing data", () => {
    const words = [
      { ...mismatch("cat", "bat", 0, 0.3), endTimestamp: null },
      exact("cat", 0.9, 1.2),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag INSERTION → EXACT when the insertion is too similar to the next word (repetition not correction)", () => {
    // "cat" insertion followed by exact "cat" — insertion is too similar (sim > 0.8) → repetition not correction
    const words = [
      insertion("cat", 0, 0.3),
      exact("cat", 0.9, 1.2),
    ];

    const result = detectSelfCorrections(words, new Set());

    // Should not be flagged as self-correction because similarity is too high
    expect(result.has(0)).toBe(false);
  });
});
