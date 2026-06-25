import { describe, expect, it } from "vitest";
import type { TranscriptResponse, TranscriptWord } from "@/types/oral-reading";
import { reconcileTranscripts } from "../transcriptReconciliationService";

function transcript(words: TranscriptWord[], duration = 1): TranscriptResponse {
  const text = words.map((word) => word.word).join(" ");

  return {
    text,
    words,
    duration,
    segments:
      words.length === 0
        ? []
        : [
            {
              id: 0,
              text,
              start: words[0].start,
              end: words[words.length - 1].end,
              words,
            },
          ],
  };
}

function word(value: string, start: number, end: number, confidence?: number): TranscriptWord {
  return {
    word: value,
    start,
    end,
    confidence,
  };
}

describe("reconcileTranscripts", () => {
  it("recovers a Google omission when OpenAI heard the expected passage word", () => {
    const google = transcript([word("the", 0, 0.2), word("cat", 0.6, 0.8)]);
    const openAI = transcript([
      word("the", 0, 0.2),
      word("big", 0.2, 0.4, 0.92),
      word("cat", 0.4, 0.6),
    ]);

    const result = reconcileTranscripts(google, openAI, "the big cat");

    expect(result.words.map((item) => item.word)).toEqual(["the", "big", "cat"]);
    expect(result.words[1].start).toBe(0.2);
    expect(result.words[1].end).toBe(0.5);
  });

  it("replaces a Google mismatch when OpenAI has a strong exact candidate", () => {
    const google = transcript([
      word("the", 0, 0.2),
      word("bat", 0.2, 0.4, 0.7),
      word("sat", 0.4, 0.6),
    ]);
    const openAI = transcript([
      word("the", 0, 0.2),
      word("cat", 0.2, 0.4, 0.9),
      word("sat", 0.4, 0.6),
    ]);

    const result = reconcileTranscripts(google, openAI, "the cat sat");

    expect(result.words.map((item) => item.word)).toEqual(["the", "cat", "sat"]);
    expect(result.words[1].start).toBe(0.2);
    expect(result.words[1].end).toBe(0.4);
  });

  it("keeps Google wording when OpenAI is not materially closer to the passage", () => {
    const google = transcript([
      word("the", 0, 0.2),
      word("cap", 0.2, 0.4),
      word("sat", 0.4, 0.6),
    ]);
    const openAI = transcript([
      word("the", 0, 0.2),
      word("car", 0.2, 0.4),
      word("sat", 0.4, 0.6),
    ]);

    const result = reconcileTranscripts(google, openAI, "the cat sat");

    expect(result.words.map((item) => item.word)).toEqual(["the", "cap", "sat"]);
  });

  it("returns Google unchanged when there is no passage context", () => {
    const google = transcript([word("the", 0, 0.2), word("cat", 0.2, 0.4)]);
    const openAI = transcript([word("the", 0, 0.2), word("big", 0.2, 0.4), word("cat", 0.4, 0.6)]);

    expect(reconcileTranscripts(google, openAI, "")).toBe(google);
  });
});
