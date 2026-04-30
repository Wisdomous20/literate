import { describe, expect, it } from "vitest";
import { AlignedWord } from "@/types/oral-reading";
import { detectBehaviors } from "../behaviorDetectionService";

function exact(
  word: string,
  idx: number,
  timestamp: number,
  endTimestamp: number,
): AlignedWord {
  return {
    expected: word,
    spoken: word,
    expectedIndex: idx,
    spokenIndex: idx,
    timestamp,
    endTimestamp,
    confidence: null,
    match: "EXACT",
  };
}

function hasPunctuationDismissal(
  behaviors: Awaited<ReturnType<typeof detectBehaviors>>,
) {
  return behaviors.some(
    (behavior) => behavior.behaviorType === "DISMISSAL_OF_PUNCTUATION",
  );
}

describe("detectBehaviors punctuation dismissal", () => {
  it("does not flag dismissal when the short pauses are only comma-level cues", async () => {
    const passage = [
      "When,",
      "we",
      "read,",
      "we",
      "pause,",
      "then",
      "continue.",
      "Today",
    ];
    const alignedWords = [
      exact("When", 0, 0, 0.3),
      exact("we", 1, 0.36, 0.6),
      exact("read", 2, 0.7, 1.0),
      exact("we", 3, 1.05, 1.3),
      exact("pause", 4, 1.4, 1.7),
      exact("then", 5, 1.75, 2.0),
      exact("continue", 6, 2.1, 2.4),
      exact("Today", 7, 2.78, 3.0),
    ];

    const behaviors = await detectBehaviors(alignedWords, passage);

    expect(hasPunctuationDismissal(behaviors)).toBe(false);
  });

  it("does not flag dismissal when only two of three strong punctuation pauses are short", async () => {
    const passage = ["The", "sun.", "It", "sets.", "We", "watch.", "Then", "go"];
    const alignedWords = [
      exact("The", 0, 0, 0.25),
      exact("sun", 1, 0.3, 0.55),
      exact("It", 2, 0.6, 0.85),
      exact("sets", 3, 0.9, 1.15),
      exact("We", 4, 1.2, 1.45),
      exact("watch", 5, 1.5, 1.75),
      exact("Then", 6, 2.1, 2.35),
      exact("go", 7, 2.4, 2.65),
    ];

    const behaviors = await detectBehaviors(alignedWords, passage);

    expect(hasPunctuationDismissal(behaviors)).toBe(false);
  });

  it("flags dismissal when repeated strong punctuation pauses are short", async () => {
    const passage = ["The", "sun.", "It", "sets.", "We", "watch.", "Then", "go"];
    const alignedWords = [
      exact("The", 0, 0, 0.25),
      exact("sun", 1, 0.3, 0.55),
      exact("It", 2, 0.6, 0.85),
      exact("sets", 3, 0.9, 1.15),
      exact("We", 4, 1.2, 1.45),
      exact("watch", 5, 1.5, 1.75),
      exact("Then", 6, 1.8, 2.05),
      exact("go", 7, 2.1, 2.35),
    ];

    const behaviors = await detectBehaviors(alignedWords, passage);

    expect(hasPunctuationDismissal(behaviors)).toBe(true);
  });
});
