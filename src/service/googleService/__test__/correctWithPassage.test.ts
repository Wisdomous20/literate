import { describe, expect, it } from "vitest";
import correctWithPassage from "../correctWithPassage";
import { TranscriptWord } from "@/types/oral-reading";

function word(w: string, start = 0, end = 1): TranscriptWord {
  return { word: w, start, end };
}

describe("correctWithPassage", () => {
  it("returns the input unchanged when the passage is empty", () => {
    const words = [word("hello"), word("world")];

    const result = correctWithPassage(words, "");

    expect(result.map((w) => w.word)).toEqual(["hello", "world"]);
  });

  it("returns the input unchanged when there are no transcribed words", () => {
    const result = correctWithPassage([], "hello world");

    expect(result).toHaveLength(0);
  });

  it("corrects a word that is likely noise (high similarity, not a morphological variant)", () => {
    // "thhe" has 1 edit from "the" (4 chars) → similarity 0.75, above the 0.7 noise threshold
    const words = [word("thhe"), word("cat"), word("sat")];
    const passage = "the cat sat";

    const result = correctWithPassage(words, passage);

    expect(result[0].word).toBe("the");
  });

  it("preserves morphological variants and does not force them to the passage word", () => {
    // "runs" is a valid morphological variant of "run" — should stay as-is
    const words = [word("she"), word("runs"), word("fast")];
    const passage = "she run fast";

    const result = correctWithPassage(words, passage);

    expect(result[1].word).toBe("runs");
  });

  it("preserves Filipino um/reduplicated variants so they can be flagged as miscues", () => {
    const words = [word("bumubukas")];
    const passage = "bumukas";

    const result = correctWithPassage(words, passage, 0.55, "filipino");

    expect(result[0].word).toBe("bumubukas");
  });

  it.each([
    ["um infix", "bukas", "bumukas"],
    ["in infix", "sulat", "sinulat"],
    ["in infix with another root", "balik", "binalik"],
    ["in infix plus CV reduplication", "sinulat", "sinusulat"],
    ["CV reduplication", "sulat", "susulat"],
    ["prefix plus CV reduplication", "pagbasa", "pagbabasa"],
    ["ma/na prefix", "basa", "nabasa"],
    ["mag/nag prefix", "laro", "naglalaro"],
    ["mag/nag prefix alternation", "magbasa", "nagbasa"],
    ["ma/na prefix alternation", "mabasa", "nabasa"],
  ])("preserves Filipino %s variants before miscue detection", (_, passage, spoken) => {
    const result = correctWithPassage([word(spoken)], passage, 0.55, "filipino");

    expect(result[0].word).toBe(spoken);
  });

  it("keeps default English passage correction behavior unchanged", () => {
    const words = [word("bumubukas")];
    const passage = "bumukas";

    const result = correctWithPassage(words, passage);

    expect(result[0].word).toBe("bumukas");
  });

  it("keeps default English correction for Filipino-looking in infix words unchanged", () => {
    const result = correctWithPassage([word("sinulat")], "sulat");

    expect(result[0].word).toBe("sulat");
  });

  it("preserves genuinely different words even when they are somewhat similar", () => {
    // "cat" and "bat" differ by only one letter (sim ~0.67) but sit below 0.7
    const words = [word("the"), word("bat"), word("flew")];
    const passage = "the cat flew";

    const result = correctWithPassage(words, passage);

    // "bat" similarity to "cat" is below the noise threshold — should not be corrected
    expect(result[1].word).toBe("bat");
  });

  it("preserves start/end timestamps for corrected words", () => {
    const words = [word("tge", 0.5, 1.0)];
    const passage = "the";

    const result = correctWithPassage(words, passage);

    expect(result[0].start).toBe(0.5);
    expect(result[0].end).toBe(1.0);
  });

  it("expands hyphenated passage words before aligning", () => {
    // "well-known" should be split into "well" and "known"
    const words = [word("well"), word("known")];
    const passage = "well-known author";

    const result = correctWithPassage(words, passage);

    // Words should be matched and preserved, not mutated
    expect(result.map((w) => w.word)).toContain("well");
    expect(result.map((w) => w.word)).toContain("known");
  });

  it("returns the same number of words as transcribed (no insertions or deletions)", () => {
    const words = [word("a"), word("kwik"), word("brwn"), word("fox")];
    const passage = "a quick brown fox";

    const result = correctWithPassage(words, passage);

    expect(result).toHaveLength(4);
  });
});
