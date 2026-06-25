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

  it("anchors an omission to the end of the preceding spoken word", () => {
    const miscues: MiscueResult[] = [
      {
        miscueType: "OMISSION",
        expectedWord: "brown",
        spokenWord: null,
        wordIndex: 1,
        timestamp: null,
        isSelfCorrected: false,
      },
    ];
    const alignedWords: AlignedWord[] = [
      {
        expected: "The",
        spoken: "The",
        expectedIndex: 0,
        spokenIndex: 0,
        timestamp: 0.2,
        endTimestamp: 0.6,
        confidence: null,
        match: "EXACT",
      },
      {
        expected: "brown",
        spoken: null,
        expectedIndex: 1,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      },
      {
        expected: "fox",
        spoken: "fox",
        expectedIndex: 2,
        spokenIndex: 1,
        timestamp: 0.8,
        endTimestamp: 1.1,
        confidence: null,
        match: "EXACT",
      },
    ];

    expect(hydrateMiscueTimestamps(miscues, alignedWords)[0].timestamp).toBe(0.6);
  });

  it("replaces a stale timestamp on an omission with its passage-local anchor", () => {
    const miscues: MiscueResult[] = [
      {
        miscueType: "OMISSION",
        expectedWord: "brown",
        spokenWord: null,
        wordIndex: 1,
        timestamp: 1.3,
        isSelfCorrected: false,
      },
    ];
    const alignedWords: AlignedWord[] = [
      {
        expected: "The",
        spoken: "The",
        expectedIndex: 0,
        spokenIndex: 0,
        timestamp: 0.2,
        endTimestamp: 0.6,
        confidence: null,
        match: "EXACT",
      },
      {
        expected: "brown",
        spoken: null,
        expectedIndex: 1,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      },
      {
        expected: "fox",
        spoken: "fox",
        expectedIndex: 2,
        spokenIndex: 1,
        timestamp: 0.8,
        endTimestamp: 1.1,
        confidence: null,
        match: "EXACT",
      },
    ];

    expect(hydrateMiscueTimestamps(miscues, alignedWords)[0].timestamp).toBe(0.6);
  });

  it("uses the next spoken word for an omission at the beginning of a passage", () => {
    const miscues: MiscueResult[] = [
      {
        miscueType: "OMISSION",
        expectedWord: "The",
        spokenWord: null,
        wordIndex: 0,
        timestamp: null,
        isSelfCorrected: false,
      },
    ];
    const alignedWords: AlignedWord[] = [
      {
        expected: "The",
        spoken: null,
        expectedIndex: 0,
        spokenIndex: null,
        timestamp: null,
        endTimestamp: null,
        confidence: null,
        match: "OMISSION",
      },
      {
        expected: "cat",
        spoken: "cat",
        expectedIndex: 1,
        spokenIndex: 0,
        timestamp: 0.5,
        endTimestamp: 0.8,
        confidence: null,
        match: "EXACT",
      },
    ];

    expect(hydrateMiscueTimestamps(miscues, alignedWords)[0].timestamp).toBe(0.5);
  });
});
