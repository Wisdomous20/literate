import { describe, expect, it } from "vitest";
import { alignWords } from "../alignmentService";

function spoken(word: string, start: number, end: number) {
  return { word, start, end };
}

describe("alignWords", () => {
  it("returns an empty array when both inputs are empty", () => {
    const result = alignWords([], []);
    expect(result).toHaveLength(0);
  });

  it("marks all passage words as OMISSION when spoken list is empty", () => {
    const result = alignWords(["the", "cat", "sat"], []);

    expect(result).toHaveLength(3);
    expect(result.every((w) => w.match === "OMISSION")).toBe(true);
  });

  it("marks all spoken words as INSERTION when passage list is empty", () => {
    const result = alignWords([], [spoken("hello", 0, 0.5), spoken("world", 0.5, 1.0)]);

    expect(result).toHaveLength(2);
    expect(result.every((w) => w.match === "INSERTION")).toBe(true);
  });

  it("marks a word as EXACT when the spoken word matches the passage word exactly", () => {
    const result = alignWords(["cat"], [spoken("cat", 0, 0.5)]);

    expect(result).toHaveLength(1);
    expect(result[0].match).toBe("EXACT");
    expect(result[0].expected).toBe("cat");
    expect(result[0].spoken).toBe("cat");
  });

  it("marks a word as MISMATCH when spoken and expected are similar but not identical", () => {
    // "kat" is not a normalized-equal match for "cat", but they are similar
    const result = alignWords(["cat"], [spoken("kat", 0, 0.5)]);

    expect(result).toHaveLength(1);
    expect(result[0].match).toBe("MISMATCH");
  });

  it("produces an OMISSION for a passage word with no spoken counterpart", () => {
    // Student skipped "sat"
    const result = alignWords(["the", "cat", "sat"], [spoken("the", 0, 0.3), spoken("cat", 0.3, 0.6)]);

    const omissions = result.filter((w) => w.match === "OMISSION");
    expect(omissions).toHaveLength(1);
    expect(omissions[0].expected).toBe("sat");
  });

  it("produces an INSERTION for a spoken word with no passage counterpart", () => {
    const result = alignWords(["the", "cat"], [spoken("the", 0, 0.3), spoken("big", 0.3, 0.6), spoken("cat", 0.6, 0.9)]);

    const insertions = result.filter((w) => w.match === "INSERTION");
    expect(insertions).toHaveLength(1);
    expect(insertions[0].spoken).toBe("big");
  });

  it("preserves timestamps from the spoken words", () => {
    const result = alignWords(["cat"], [spoken("cat", 1.5, 2.0)]);

    expect(result[0].timestamp).toBe(1.5);
    expect(result[0].endTimestamp).toBe(2.0);
  });

  it("is case-insensitive when comparing words for EXACT vs MISMATCH", () => {
    const result = alignWords(["The"], [spoken("the", 0, 0.5)]);

    expect(result[0].match).toBe("EXACT");
  });

  it("aligns multiple words in the correct order", () => {
    const result = alignWords(
      ["the", "quick", "fox"],
      [spoken("the", 0, 0.3), spoken("quick", 0.3, 0.6), spoken("fox", 0.6, 0.9)],
    );

    expect(result).toHaveLength(3);
    expect(result.map((w) => w.expected)).toEqual(["the", "quick", "fox"]);
    expect(result.every((w) => w.match === "EXACT")).toBe(true);
  });
});
