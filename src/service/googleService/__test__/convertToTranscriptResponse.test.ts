import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCorrectWithPassage = vi.hoisted(() => vi.fn((words: unknown) => words));

vi.mock("../correctWithPassage", () => ({ default: mockCorrectWithPassage }));

import convertToTranscriptResponse from "../convertToTranscriptResponse";

// A minimal WAV buffer: 44-byte header + 48000 bytes of audio = 1 second at 24kHz/16-bit
const ONE_SECOND_WAV = Buffer.alloc(44 + 48000);

function makeWordInfo(word: string, startSec: number, endSec: number) {
  return {
    word,
    startOffset: { seconds: Math.floor(startSec), nanos: 0 },
    endOffset:   { seconds: Math.floor(endSec),   nanos: 0 },
  };
}

function makeResult(words: ReturnType<typeof makeWordInfo>[], transcript = "") {
  return {
    alternatives: [{ words, transcript }],
  };
}

describe("convertToTranscriptResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCorrectWithPassage.mockImplementation((words: unknown) => words);
  });

  it("returns an empty text and zero duration when results are empty", () => {
    const response = convertToTranscriptResponse([], Buffer.alloc(44), true, undefined);

    expect(response.text).toBe("");
    expect(response.duration).toBe(0);
    expect(response.words).toHaveLength(0);
    expect(response.segments).toHaveLength(0);
  });

  it("builds words from the best alternative's word list", () => {
    const results = [makeResult([makeWordInfo("hello", 0, 0.5), makeWordInfo("world", 0.5, 1)])];

    const response = convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(response.words.map((w) => w.word)).toEqual(["hello", "world"]);
    expect(response.text).toBe("hello world");
  });

  it("derives duration from WAV buffer length when no words are present", () => {
    // 44-byte header + 48000 bytes = exactly 1 second
    const response = convertToTranscriptResponse([], ONE_SECOND_WAV, true, undefined);

    expect(response.duration).toBe(1.0);
  });

  it("uses word timestamps to determine duration when words are present", () => {
    const results = [makeResult([makeWordInfo("hello", 0, 2), makeWordInfo("world", 2, 4)])];

    const response = convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(response.duration).toBe(4.0);
  });

  it("calls correctWithPassage when passage text is provided", () => {
    const results = [makeResult([makeWordInfo("tge", 0, 1)])];

    convertToTranscriptResponse(results, ONE_SECOND_WAV, true, "the cat sat");

    expect(mockCorrectWithPassage).toHaveBeenCalledOnce();
  });

  it("does not call correctWithPassage when no passage text is given", () => {
    const results = [makeResult([makeWordInfo("hello", 0, 1)])];

    convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(mockCorrectWithPassage).not.toHaveBeenCalled();
  });

  it("skips results with no alternatives", () => {
    const results = [{ alternatives: [] }, makeResult([makeWordInfo("world", 0, 1)])];

    const response = convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(response.words.map((w) => w.word)).toEqual(["world"]);
  });

  it("rounds duration to one decimal place", () => {
    // 44 header + 48111 bytes → 48111/48000 ≈ 1.002 seconds → rounded to 1.0
    const response = convertToTranscriptResponse(
      [],
      Buffer.alloc(44 + 48111),
      true,
      undefined,
    );

    expect(response.duration).toBe(1.0);
  });

  it("collects words from multiple results into one flat word list", () => {
    const results = [
      makeResult([makeWordInfo("the", 0, 0.5)]),
      makeResult([makeWordInfo("cat", 0.5, 1.0)]),
    ];

    const response = convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(response.words).toHaveLength(2);
    expect(response.text).toBe("the cat");
  });
});
