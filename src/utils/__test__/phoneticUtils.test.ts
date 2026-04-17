  import { beforeAll, describe, expect, it } from "vitest";
  import {
    getPhoneticSimilarity,
    getPhonemes,
    initPhoneticDict,
    soundsSimilar,
  } from "@/utils/phoneticUtils";

  describe("phoneticUtils", () => {
    beforeAll(async () => {
      await initPhoneticDict();
    });

    describe("getPhonemes", () => {
      it("returns a phoneme sequence with stress markers stripped", () => {
        const phones = getPhonemes("hello");
        expect(phones).not.toBeNull();
        expect(phones!.some((p) => /[0-2]/.test(p))).toBe(false);
      });

      it("is case-insensitive", () => {
        expect(getPhonemes("HELLO")).toEqual(getPhonemes("hello"));
      });

      it("returns null for words not in the dictionary", () => {
        expect(getPhonemes("zzzqqqnotaword")).toBeNull();
      });
    });

    describe("soundsSimilar", () => {
      it("returns true for homophones", () => {
        expect(soundsSimilar("there", "their")).toBe(true);
        expect(soundsSimilar("know", "no")).toBe(true);
      });

      it("returns false for minimal pairs with different onsets", () => {
        expect(soundsSimilar("cat", "bat")).toBe(false);
        expect(soundsSimilar("mother", "father")).toBe(false);
      });

      it("returns false when a word is missing from the dictionary", () => {
        expect(soundsSimilar("hello", "zzzqqqnotaword")).toBe(false);
      });
    });

    describe("getPhoneticSimilarity", () => {
      it("returns 1 for homophones", () => {
        expect(getPhoneticSimilarity("know", "no")).toBe(1);
      });

      it("returns null when either word is missing from the dictionary", () => {
        expect(getPhoneticSimilarity("hello", "zzzqqqnotaword")).toBeNull();
      });

      it("returns a score between 0 and 1 for close-sounding words", () => {
        const sim = getPhoneticSimilarity("this", "these");
        expect(sim).not.toBeNull();
        expect(sim!).toBeGreaterThan(0);
        expect(sim!).toBeLessThanOrEqual(1);
      });
    });
  });
