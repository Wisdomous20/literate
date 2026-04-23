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

describe("detectSelfCorrections", () => {
  it("returns an empty set when there are no corrections", () => {
    const words = [exact("the", 0, 0.3), exact("cat", 0.3, 0.6)];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("detects INSERTION → EXACT as self-correction when gap is ≥ 200ms", () => {
    // Reader said "bat" (wrong), paused 250ms, then read "cat" correctly
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 0.55, 0.9), // gap = 0.25s within correction window
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
  });

  it("does not flag INSERTION → EXACT when the pause is below 200ms", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 0.4, 0.7), // gap = 0.1s — too short
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag INSERTION → EXACT when the gap exceeds the 2.0s correction window", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 2.5, 2.8), // gap = 2.2s — too long
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag MISMATCH → EXACT (self-correction only applies to insertions)", () => {
    const words = [
      mismatch("cat", "bat", 0, 0.3),
      exact("cat", 0.9, 1.2),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag INSERTION → EXACT when the insertion matches the next word (repetition, not correction)", () => {
    const words = [
      insertion("cat", 0, 0.3),
      exact("cat", 0.9, 1.2),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(false);
  });

  it("skips a pair when either index is already in the repetition set", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 0.55, 0.9),
    ];
    const repetitions = new Set([0]);

    const result = detectSelfCorrections(words, repetitions);

    expect(result.size).toBe(0);
  });

  it("skips pairs with no timing data", () => {
    const words = [
      { ...insertion("bat", 0, 0.3), endTimestamp: null },
      exact("cat", 0.9, 1.2),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("flags INSERTION → EXACT at the lower pause boundary (exactly 200ms)", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 0.5, 0.8), // gap = 0.2s exactly
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
  });

  it("flags INSERTION → EXACT at the upper pause boundary (exactly 2.0s)", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 2.3, 2.6), // gap = 2.0s exactly
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
  });

  it("does not flag INSERTION → INSERTION (correction target must be an EXACT match)", () => {
    const words = [
      insertion("bat", 0, 0.3),
      insertion("rat", 0.6, 0.9),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("does not flag INSERTION → MISMATCH (correction target must be an EXACT match)", () => {
    const words = [
      insertion("bat", 0, 0.3),
      mismatch("cat", "rat", 0.6, 0.9),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });

  it("detects multiple self-corrections in the same sequence", () => {
    const words = [
      insertion("bat", 0, 0.3),
      exact("cat", 0.6, 0.9),    // SC at index 0
      exact("sat", 0.9, 1.2),
      insertion("mad", 1.2, 1.5),
      exact("mat", 1.8, 2.1),    // SC at index 3
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.has(0)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(2);
  });

  it("does not flag INSERTION → EXACT when the insertion has no spoken text", () => {
    const words = [
      { ...insertion("bat", 0, 0.3), spoken: null },
      exact("cat", 0.6, 0.9),
    ];

    const result = detectSelfCorrections(words, new Set());

    expect(result.size).toBe(0);
  });
});
