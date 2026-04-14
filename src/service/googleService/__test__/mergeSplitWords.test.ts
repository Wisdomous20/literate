import { describe, expect, it } from "vitest";
import mergeSplitWords from "../mergeSplitWords";
import { TranscriptWord } from "@/types/oral-reading";

function word(w: string, start = 0, end = 1): TranscriptWord {
  return { word: w, start, end };
}

describe("mergeSplitWords", () => {
  it("returns the input unchanged when no fragments can be merged", () => {
    const words = [word("the"), word("cat"), word("sat")];
    const passage = ["the", "cat", "sat"];

    const result = mergeSplitWords(words, passage);

    expect(result.map((w) => w.word)).toEqual(["the", "cat", "sat"]);
  });

  it("merges two consecutive fragments into a single passage word", () => {
    // "under" + "stand" → "understand"
    const words = [word("under", 0, 0.5), word("stand", 0.5, 1.0), word("this", 1.0, 1.5)];
    const passage = ["understand", "this"];

    const result = mergeSplitWords(words, passage);

    expect(result[0].word).toBe("understand");
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(1.0);
    expect(result[1].word).toBe("this");
  });

  it("merges three consecutive fragments into a single passage word", () => {
    // "some" + "thing" + "s" → "somethings" (if in passage)
    const words = [word("some", 0, 0.3), word("where", 0.3, 0.6), word("else", 0.6, 1.0)];
    const passage = ["somewhereelse"];

    const result = mergeSplitWords(words, passage);

    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(1.0);
  });

  it("does not merge words that individually exist in the passage", () => {
    // "over" and "all" both exist in the passage, so they stay separate
    const words = [word("over"), word("all")];
    const passage = ["over", "all", "overall"];

    const result = mergeSplitWords(words, passage);

    expect(result).toHaveLength(2);
    expect(result.map((w) => w.word)).toEqual(["over", "all"]);
  });

  it("returns an empty array for empty input", () => {
    const result = mergeSplitWords([], ["hello", "world"]);

    expect(result).toHaveLength(0);
  });

  it("passes through words that have no match in the passage", () => {
    const words = [word("zzz"), word("xyz")];
    const passage = ["hello", "world"];

    const result = mergeSplitWords(words, passage);

    expect(result.map((w) => w.word)).toEqual(["zzz", "xyz"]);
  });

  it("preserves start/end timestamps after a 2-word merge", () => {
    const words = [word("every", 1.0, 1.5), word("where", 1.5, 2.0)];
    const passage = ["everywhere"];

    const result = mergeSplitWords(words, passage);

    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(1.0);
    expect(result[0].end).toBe(2.0);
  });
});
