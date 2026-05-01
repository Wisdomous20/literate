import { describe, expect, it } from "vitest";
import { hydrateMiscueTimestamps } from "../miscueTimestamps";
import type { AlignedWord, MiscueResult } from "@/types/oral-reading";

describe("hydrateMiscueTimestamps", () => {
  it("replaces suspicious zero timestamps for later miscues", () => {
    const miscues: MiscueResult[] = [
      {
        miscueType: "SUBSTITUTION",
        expectedWord: "nap",
        spokenWord: "sing",
        wordIndex: 2,
        timestamp: 0,
        isSelfCorrected: false,
      },
    ];

    const alignedWords: AlignedWord[] = [
      {
        expected: "It",
        spoken: "It",
        expectedIndex: 0,
        spokenIndex: 0,
        timestamp: 0,
        endTimestamp: 0.2,
        confidence: null,
        match: "EXACT",
      },
      {
        expected: "can",
        spoken: "can",
        expectedIndex: 1,
        spokenIndex: 1,
        timestamp: 0.3,
        endTimestamp: 0.5,
        confidence: null,
        match: "EXACT",
      },
      {
        expected: "nap",
        spoken: "sing",
        expectedIndex: 2,
        spokenIndex: 2,
        timestamp: 1.7,
        endTimestamp: 1.9,
        confidence: null,
        match: "MISMATCH",
      },
    ];

    expect(hydrateMiscueTimestamps(miscues, alignedWords)[0].timestamp).toBe(1.7);
  });

  it("keeps a valid zero timestamp for the first word", () => {
    const miscues: MiscueResult[] = [
      {
        miscueType: "SUBSTITUTION",
        expectedWord: "It",
        spokenWord: "At",
        wordIndex: 0,
        timestamp: 0,
        isSelfCorrected: false,
      },
    ];

    const alignedWords: AlignedWord[] = [
      {
        expected: "It",
        spoken: "At",
        expectedIndex: 0,
        spokenIndex: 0,
        timestamp: 0,
        endTimestamp: 0.2,
        confidence: null,
        match: "MISMATCH",
      },
    ];

    expect(hydrateMiscueTimestamps(miscues, alignedWords)[0].timestamp).toBe(0);
  });
});
