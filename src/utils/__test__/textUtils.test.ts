import { describe, expect, it } from "vitest";
import {
  editDistance,
  isReversal,
  isSimilar,
  isSimilarForRepetition,
  levenshteinDistance,
  normalizeWord,
  similarityRatio,
  tokenizeForComparison,
} from "@/utils/textUtils";

describe("normalizeWord", () => {
  it("lowercases input", () => {
    expect(normalizeWord("Hello")).toBe("hello");
  });
  it("strips apostrophes but preserves hyphens", () => {
    expect(normalizeWord("don't")).toBe("dont");
    expect(normalizeWord("well-known")).toBe("well-known");
  });

  it("removes diacritics via NFD decomposition", () => {
    expect(normalizeWord("niño")).toBe("nino");
    expect(normalizeWord("café")).toBe("cafe");
  });

  it("strips apostrophes but preserves hyphens", () => {
    expect(normalizeWord("don't")).toBe("dont");
    expect(normalizeWord("well-known")).toBe("well-known");
  });
});

describe("tokenizeForComparison", () => {
  it("splits English words into single characters", () => {
    expect(tokenizeForComparison("cat", "en")).toEqual(["c", "a", "t"]);
  });

  it("treats Tagalog 'ng' as a single digraph token", () => {
    expect(tokenizeForComparison("kanga", "tl")).toEqual(["k", "a", "ng", "a"]);
  });

  it("recognizes filipino language aliases case-insensitively", () => {
    for (const lang of ["tl", "filipino", "fil", "Tagalog"]) {
      expect(tokenizeForComparison("ngayon", lang)[0]).toBe("ng");
    }
  });
});

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("kitten", "kitten")).toBe(0);
  });

  it("counts a single substitution as 1", () => {
    expect(levenshteinDistance("kitten", "sitten")).toBe(1);
  });

  it("counts an 'ng' digraph as a single edit in Tagalog mode", () => {
    expect(levenshteinDistance("kanga", "kaa", "tl")).toBe(1);
  });
});

describe("editDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(editDistance("abc", "abc")).toBe(0);
  });

  it("counts a single substitution as 1", () => {
    expect(editDistance("abc", "abd")).toBe(1);
  });

  it("short-circuits to 999 when lengths differ by more than 2", () => {
    expect(editDistance("a", "abcd")).toBe(999);
  });
});

describe("similarityRatio", () => {
  it("returns 1 for identical strings", () => {
    expect(similarityRatio("hello", "hello")).toBe(1);
  });

  it("returns 0 when either string is empty", () => {
    expect(similarityRatio("", "hello")).toBe(0);
    expect(similarityRatio("hello", "")).toBe(0);
  });

  it("returns 1 minus edit-distance over max length", () => {
    expect(similarityRatio("abcd", "abce")).toBe(0.75);
  });
});

describe("isSimilar", () => {
  it("returns false when either input is null or undefined", () => {
    expect(isSimilar(null, "cat")).toBe(false);
    expect(isSimilar("cat", undefined)).toBe(false);
  });

  it("returns true when similarity meets the default 0.8 threshold", () => {
    expect(isSimilar("kitten", "kittin")).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(isSimilar("cat", "bat", 0.5)).toBe(true);
    expect(isSimilar("cat", "bat", 0.9)).toBe(false);
  });
});

describe("isSimilarForRepetition", () => {
  it("uses a lower 0.7 threshold than isSimilar", () => {
    expect(isSimilarForRepetition("running", "runing")).toBe(true);
  });

  it("treats normalized identical words as similar", () => {
    expect(isSimilarForRepetition("Hello!", "hello")).toBe(true);
  });

  it("returns false when either input is missing", () => {
    expect(isSimilarForRepetition(null, "x")).toBe(false);
  });
});

describe("isReversal", () => {
  it("detects exact character reversals", () => {
    expect(isReversal("saw", "was")).toBe(true);
    expect(isReversal("on", "no")).toBe(true);
  });

  it("returns false for single-character words", () => {
    expect(isReversal("a", "a")).toBe(false);
  });

  it("returns false for unrelated words", () => {
    expect(isReversal("cat", "dog")).toBe(false);
  });
});
