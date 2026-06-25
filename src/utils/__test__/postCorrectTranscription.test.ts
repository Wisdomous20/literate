import { describe, expect, it } from "vitest";
import { postCorrectTranscription } from "../postCorrectTranscription";

describe("postCorrectTranscription", () => {
  it("preserves a wrong attempt immediately followed by its exact correction", () => {
    const result = postCorrectTranscription(
      [
        { word: "it", start: 0, end: 0.2 },
        { word: "can", start: 0.2, end: 0.4 },
        { word: "shit", start: 0.4, end: 0.6 },
        { word: "sit", start: 0.6, end: 0.8 },
      ],
      ["it", "can", "sit"],
    );

    expect(result.map((word) => word.word)).toEqual([
      "it",
      "can",
      "shit",
      "sit",
    ]);
  });

  it("still corrects an isolated edit-distance-one transcription error", () => {
    const result = postCorrectTranscription(
      [{ word: "shit", start: 0, end: 0.2 }],
      ["sit"],
    );

    expect(result[0]).toMatchObject({ word: "sit", correctedFrom: "shit" });
  });

  it("preserves a high-confidence mismatch", () => {
    const result = postCorrectTranscription(
      [{ word: "shit", start: 0, end: 0.2, confidence: 0.9 }],
      ["sit"],
    );

    expect(result[0].word).toBe("shit");
  });

  it("corrects a low-confidence edit-distance-one transcription error", () => {
    const result = postCorrectTranscription(
      [{ word: "shit", start: 0, end: 0.2, confidence: 0.2 }],
      ["sit"],
    );

    expect(result[0]).toMatchObject({ word: "sit", correctedFrom: "shit" });
  });
});
