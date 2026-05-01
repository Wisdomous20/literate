import { describe, expect, it, vi, beforeEach } from "vitest";
import { protos } from "@google-cloud/speech";

const mockCorrectWithPassage = vi.hoisted(() => vi.fn((words: unknown) => words));

vi.mock("../correctWithPassage", () => ({ default: mockCorrectWithPassage }));

import convertToTranscriptResponse from "../convertToTranscriptResponse";

// A minimal WAV buffer: 44-byte header + 48000 bytes of audio = 1 second at 24kHz/16-bit
const ONE_SECOND_WAV = Buffer.alloc(44 + 48000);

type TestWordInfo = {
  word: string;
  startOffset: protos.google.protobuf.IDuration | string;
  endOffset: protos.google.protobuf.IDuration | string;
};

function makeDuration(seconds: number) {
  const wholeSeconds = Math.floor(seconds);
  return {
    seconds: wholeSeconds,
    nanos: Math.round((seconds - wholeSeconds) * 1e9),
  };
}

function makeWordInfo(word: string, startSec: number, endSec: number): TestWordInfo {
  return {
    word,
    startOffset: makeDuration(startSec),
    endOffset: makeDuration(endSec),
  };
}

function makeRestWordInfo(word: string, startSec: string, endSec: string): TestWordInfo {
  return {
    word,
    startOffset: startSec,
    endOffset: endSec,
  };
}

function makeResult(
  words: TestWordInfo[],
  transcript = "",
): protos.google.cloud.speech.v2.ISpeechRecognitionResult {
  return {
    alternatives: [
      {
        words: words as unknown as protos.google.cloud.speech.v2.IWordInfo[],
        transcript,
      },
    ],
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

  it("parses protobuf JSON duration strings from REST word offsets", () => {
    const results = [
      makeResult([makeRestWordInfo("later", "1.2s", "1.8s")]),
    ];

    const response = convertToTranscriptResponse(results, ONE_SECOND_WAV, true, undefined);

    expect(response.words[0]).toEqual({
      word: "later",
      start: 1.2,
      end: 1.8,
    });
    expect(response.duration).toBe(1.8);
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
