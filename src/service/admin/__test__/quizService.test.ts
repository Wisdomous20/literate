import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  quiz: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { createQuizService } from "../createQuizService";
import { updateQuizService } from "../updateQuizService";

const mcQuestion = {
  questionText: "What is the main idea?",
  tags: "Literal" as const,
  type: "MULTIPLE_CHOICE" as const,
  options: ["A", "B", "C", "D"],
  correctAnswer: "A",
};

const essayQuestion = {
  questionText: "Describe the setting.",
  tags: "Critical" as const,
  type: "ESSAY" as const,
};

const baseQuiz = {
  id: "quiz-1",
  passageId: "passage-1",
  totalScore: 10,
  totalNumber: 2,
};

describe("createQuizService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when passageId is missing", async () => {
    const result = await createQuizService({
      passageId: "",
      totalScore: 10,
      totalNumber: 1,
      questions: [essayQuestion],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.quiz.create).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when totalScore is zero or negative", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 0,
      totalNumber: 1,
      questions: [essayQuestion],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when totalNumber is zero or negative", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 0,
      questions: [essayQuestion],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when questions array is empty", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 1,
      questions: [],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when a question is missing required fields", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 1,
      questions: [{ questionText: "", tags: "Literal", type: "ESSAY" }],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR for MULTIPLE_CHOICE question with fewer than 2 options", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 1,
      questions: [{ ...mcQuestion, options: ["A"], correctAnswer: "A" }],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR for MULTIPLE_CHOICE question without correctAnswer", async () => {
    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 1,
      questions: [{ ...mcQuestion, correctAnswer: undefined }],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("creates a quiz with mixed question types and returns the quiz", async () => {
    mockPrisma.quiz.create.mockResolvedValue(baseQuiz);

    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 2,
      questions: [mcQuestion, essayQuestion],
    });

    expect(result.success).toBe(true);
    expect(result.quiz).toMatchObject({
      id: baseQuiz.id,
      passageId: baseQuiz.passageId,
      totalScore: baseQuiz.totalScore,
      totalNumber: baseQuiz.totalNumber,
    });
    expect(mockPrisma.quiz.create).toHaveBeenCalledOnce();
  });

  it("creates a quiz with only ESSAY questions", async () => {
    mockPrisma.quiz.create.mockResolvedValue({ ...baseQuiz, totalNumber: 1 });

    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 5,
      totalNumber: 1,
      questions: [essayQuestion],
    });

    expect(result.success).toBe(true);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.quiz.create.mockRejectedValue(new Error("DB down"));

    const result = await createQuizService({
      passageId: "passage-1",
      totalScore: 10,
      totalNumber: 1,
      questions: [essayQuestion],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("updateQuizService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when id is missing", async () => {
    const result = await updateQuizService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.quiz.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when quiz does not exist", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(null);

    const result = await updateQuizService({ id: "nonexistent", totalScore: 20 });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.quiz.update).not.toHaveBeenCalled();
  });

  it("updates totalScore and totalNumber and returns the quiz", async () => {
    const updated = { ...baseQuiz, totalScore: 20, totalNumber: 3 };
    mockPrisma.quiz.findUnique.mockResolvedValue({ ...baseQuiz, questions: [] });
    mockPrisma.quiz.update.mockResolvedValue(updated);

    const result = await updateQuizService({
      id: baseQuiz.id,
      totalScore: 20,
      totalNumber: 3,
    });

    expect(result.success).toBe(true);
    expect(result.quiz?.totalScore).toBe(20);
    expect(result.quiz?.totalNumber).toBe(3);
  });

  it("upserts questions when a questions array is provided", async () => {
    const updated = { ...baseQuiz, totalNumber: 1 };
    mockPrisma.quiz.findUnique.mockResolvedValue({ ...baseQuiz, questions: [] });
    mockPrisma.quiz.update.mockResolvedValue(updated);

    const result = await updateQuizService({
      id: baseQuiz.id,
      questions: [mcQuestion],
    });

    expect(result.success).toBe(true);
    const updateCall = mockPrisma.quiz.update.mock.calls[0][0];
    expect(updateCall.data.questions?.upsert).toHaveLength(1);
  });

  it("skips question update when no questions array is provided", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue({ ...baseQuiz, questions: [] });
    mockPrisma.quiz.update.mockResolvedValue(baseQuiz);

    await updateQuizService({ id: baseQuiz.id, totalScore: 15 });

    const updateCall = mockPrisma.quiz.update.mock.calls[0][0];
    expect(updateCall.data.questions).toBeUndefined();
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await updateQuizService({ id: "quiz-1", totalScore: 10 });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
