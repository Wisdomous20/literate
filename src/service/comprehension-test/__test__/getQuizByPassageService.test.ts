import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  quiz: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getQuizByPassageService } from "../getQuizByPassageService";

const baseQuiz = {
  id: "quiz-1",
  questions: [
    {
      id: "q-1",
      questionText: "What is the main idea?",
      tags: "Literal",
      type: "MULTIPLE_CHOICE",
      options: ["A", "B", "C", "D"],
    },
  ],
};

describe("getQuizByPassageService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when no quiz exists for the passage", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const result = await getQuizByPassageService("passage-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No quiz found for this passage.");
  });

  it("returns the quiz with its questions on success", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(baseQuiz);

    const result = await getQuizByPassageService("passage-1");

    expect(result.success).toBe(true);
    expect(result.quiz).toMatchObject({ id: "quiz-1" });
    expect(result.quiz?.questions).toHaveLength(1);
  });

  it("queries by passageId", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(baseQuiz);

    await getQuizByPassageService("passage-99");

    expect(mockPrisma.quiz.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { passageId: "passage-99" } }),
    );
  });

  it("returns failure when prisma throws", async () => {
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getQuizByPassageService("passage-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to fetch quiz.");
  });
});
