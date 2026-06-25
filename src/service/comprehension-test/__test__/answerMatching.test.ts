import { describe, expect, it } from "vitest";
import {
  answerMatchesGuide,
  answersMatchExactly,
  normalizeAnswerForExactMatch,
} from "../answerMatching";

describe("answerMatching", () => {
  it("normalizes whitespace and casing for exact matches", () => {
    expect(
      normalizeAnswerForExactMatch("  AI can help\nstudents.  "),
    ).toBe("ai can help students.");
  });

  it("matches exact guide answers with whitespace differences", () => {
    expect(
      answersMatchExactly(
        "AI can help students.\nStudents must be responsible.",
        " ai can help students. Students must be responsible. ",
      ),
    ).toBe(true);
  });

  it("matches high-overlap guide answers before AI grading", () => {
    const guideAnswer =
      "AI helps students study, find information, practice new skills, check spelling, translate words, and learn responsibly.";

    expect(
      answerMatchesGuide(
        guideAnswer,
        "AI helps students study, find information, practice skills, check spelling, translate words, and learn responsibly.",
      ),
    ).toBe(true);
  });

  it("does not match unrelated answers", () => {
    expect(
      answerMatchesGuide(
        "AI helps students study and check information responsibly.",
        "The character went to the market to buy food.",
      ),
    ).toBe(false);
  });
});
