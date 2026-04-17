import { describe, expect, it } from "vitest";
import { selectBestAlternative } from "../selectBestAlternative";

// Minimal IWordInfo shape with just the `word` field needed by the function
function makeWord(word: string) {
  return { word };
}

function makeAlt(words: string[]) {
  return { words: words.map(makeWord) };
}

describe("selectBestAlternative", () => {
  it("returns the only alternative when there is just one", () => {
    const alts = [makeAlt(["the", "cat", "sat"])];

    const result = selectBestAlternative(alts, ["the", "cat", "sat"]);

    expect(result).toBe(alts[0]);
  });

  it("returns the first alternative when the alternatives array is empty", () => {
    const alts = [makeAlt([])];

    const result = selectBestAlternative(alts, ["hello"]);

    expect(result).toBe(alts[0]);
  });

  it("picks the alternative whose words best match the passage exactly", () => {
    const goodAlt = makeAlt(["the", "quick", "brown", "fox"]);
    const badAlt  = makeAlt(["a", "fast", "purple", "dog"]);
    const passage = ["the", "quick", "brown", "fox"];

    const result = selectBestAlternative([badAlt, goodAlt], passage);

    expect(result).toBe(goodAlt);
  });

  it("uses phonetic similarity to score homophones as better matches", () => {
    // "there" and "their" are homophones — the alternative containing "their"
    // should score higher when the passage has "their"
    const altThere = makeAlt(["there", "was", "a", "cat"]);
    const altTheir = makeAlt(["their", "was", "a", "cat"]);
    const passage  = ["their", "was", "a", "cat"];

    const result = selectBestAlternative([altThere, altTheir], passage);

    expect(result).toBe(altTheir);
  });

  it("picks the alternative with higher similarity when no exact matches exist", () => {
    // "runing" (1 edit from "running") has similarity 0.857 → scores 1 point
    // "hopping" has very low similarity to "running" → scores 0 points
    const altClose = makeAlt(["runing"]);
    const altFar   = makeAlt(["hopping"]);
    const passage  = ["running"];

    const result = selectBestAlternative([altFar, altClose], passage);

    expect(result).toBe(altClose);
  });

  it("skips alternatives with no words and falls back to one that has words", () => {
    const emptyAlt = { words: [] };
    const goodAlt  = makeAlt(["hello", "world"]);

    const result = selectBestAlternative([emptyAlt, goodAlt], ["hello", "world"]);

    expect(result).toBe(goodAlt);
  });

  it("normalises scores by word count so a longer alternative does not win just by being longer", () => {
    // Two-word alt matches passage 2/2 (score 1.0 normalized)
    // Four-word alt matches passage 2/4 (score 0.5 normalized)
    const shortAlt = makeAlt(["the", "cat"]);
    const longAlt  = makeAlt(["the", "cat", "drank", "milk"]);
    const passage  = ["the", "cat"];

    const result = selectBestAlternative([longAlt, shortAlt], passage);

    expect(result).toBe(shortAlt);
  });
});
