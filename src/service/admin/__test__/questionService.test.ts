import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  quiz: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  question: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { JsonNull: null },
}));

import { addQuestionService } from "../addQuestionService";
import { deleteQuestionService } from "../deleteQuestionService";
import { getAllQuestionsService } from "../getAllQuestionsService";
import { getQuestionByIdService } from "../getQuestionByIdService";
import { updateQuestionService } from "../updateQuestionService";

const baseQuestion = {
  id: "question-1",
  quizId: "quiz-1",
  questionText: "What is the main idea?",
  tags: "Literal",
  type: "MULTIPLE_CHOICE",
  options: ["A", "B", "C", "D"],
  correctAnswer: "A",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
};

const baseQuiz = {
  id: "quiz-1",
  passageId: "passage-1",
  totalScore: 10,
  totalNumber: 1,
};

const basePassage = {
  id: "passage-1",
  title: "The Fox",
  level: 3,
  language: "English",
};

// Question with nested quiz+passage as returned by findMany with include
const questionWithRelations = {
  ...baseQuestion,
  quiz: {
    ...baseQuiz,
    passage: basePassage,
  },
};

describe("addQuestionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when required fields are missing", async () => {
    const result = await addQuestionService({
      passageId: "",
      questionText: "Some question?",
      tags: "Literal",
      type: "ESSAY",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.quiz.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR for MULTIPLE_CHOICE without options or correctAnswer", async () => {
    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: "Which one?",
      tags: "Inferential",
      type: "MULTIPLE_CHOICE",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR for MULTIPLE_CHOICE with fewer than 2 options", async () => {
    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: "Which one?",
      tags: "Inferential",
      type: "MULTIPLE_CHOICE",
      options: ["A"],
      correctAnswer: "A",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("creates a new quiz when none exists for the passage, then adds the question", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(null);
    mockPrisma.quiz.create.mockResolvedValue(baseQuiz);
    mockPrisma.question.create.mockResolvedValue(baseQuestion);
    mockPrisma.quiz.update.mockResolvedValue({ ...baseQuiz, totalNumber: 1 });

    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: baseQuestion.questionText,
      tags: "Literal",
      type: "MULTIPLE_CHOICE",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.quiz.create).toHaveBeenCalled();
    expect(result.question?.id).toBe(baseQuestion.id);
  });

  it("reuses an existing quiz when one already exists for the passage", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(baseQuiz);
    mockPrisma.question.create.mockResolvedValue(baseQuestion);
    mockPrisma.quiz.update.mockResolvedValue({ ...baseQuiz, totalNumber: 2 });

    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: baseQuestion.questionText,
      tags: "Literal",
      type: "MULTIPLE_CHOICE",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.quiz.create).not.toHaveBeenCalled();
  });

  it("adds an ESSAY question without options or correctAnswer", async () => {
    const essayQuestion = { ...baseQuestion, type: "ESSAY", options: null, correctAnswer: null };
    mockPrisma.quiz.findUnique.mockResolvedValue(baseQuiz);
    mockPrisma.question.create.mockResolvedValue(essayQuestion);
    mockPrisma.quiz.update.mockResolvedValue(baseQuiz);

    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: "Explain the story.",
      tags: "Critical",
      type: "ESSAY",
    });

    expect(result.success).toBe(true);
    expect(result.question?.type).toBe("ESSAY");
  });

  it("increments quiz totalNumber after adding a question", async () => {
    mockPrisma.quiz.findUnique.mockResolvedValue(baseQuiz);
    mockPrisma.question.create.mockResolvedValue(baseQuestion);
    mockPrisma.quiz.update.mockResolvedValue({ ...baseQuiz, totalNumber: 2 });

    await addQuestionService({
      passageId: "passage-1",
      questionText: "Question?",
      tags: "Literal",
      type: "ESSAY",
    });

    expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
      where: { id: baseQuiz.id },
      data: { totalNumber: { increment: 1 } },
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.quiz.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await addQuestionService({
      passageId: "passage-1",
      questionText: "Question?",
      tags: "Literal",
      type: "ESSAY",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("deleteQuestionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when id is empty", async () => {
    const result = await deleteQuestionService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.question.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when question does not exist", async () => {
    mockPrisma.question.findUnique.mockResolvedValue(null);

    const result = await deleteQuestionService({ id: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.question.delete).not.toHaveBeenCalled();
  });

  it("deletes the question and decrements quiz totalNumber", async () => {
    mockPrisma.question.findUnique.mockResolvedValue(baseQuestion);
    mockPrisma.question.delete.mockResolvedValue(baseQuestion);
    mockPrisma.quiz.update.mockResolvedValue({ ...baseQuiz, totalNumber: 0 });

    const result = await deleteQuestionService({ id: baseQuestion.id });

    expect(result.success).toBe(true);
    expect(mockPrisma.question.delete).toHaveBeenCalledWith({
      where: { id: baseQuestion.id },
    });
    expect(mockPrisma.quiz.update).toHaveBeenCalledWith({
      where: { id: baseQuestion.quizId },
      data: { totalNumber: { decrement: 1 } },
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.question.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await deleteQuestionService({ id: "question-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("getAllQuestionsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all questions with formatted passage data", async () => {
    mockPrisma.question.findMany.mockResolvedValue([questionWithRelations]);

    const result = await getAllQuestionsService();

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.questions?.[0]).toMatchObject({
      id: baseQuestion.id,
      questionText: baseQuestion.questionText,
      passageTitle: basePassage.title,
      passageLevel: basePassage.level,
      language: basePassage.language,
      passageId: basePassage.id,
    });
  });

  it("returns an empty array when no questions exist", async () => {
    mockPrisma.question.findMany.mockResolvedValue([]);

    const result = await getAllQuestionsService();

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(0);
  });

  it("falls back to defaults when quiz or passage relation is missing", async () => {
    const orphanQuestion = { ...baseQuestion, quiz: null };
    mockPrisma.question.findMany.mockResolvedValue([orphanQuestion]);

    const result = await getAllQuestionsService();

    expect(result.success).toBe(true);
    expect(result.questions?.[0].passageTitle).toBe("Unknown Passage");
    expect(result.questions?.[0].passageLevel).toBe(0);
    expect(result.questions?.[0].language).toBe("English");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.question.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getAllQuestionsService();

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("getQuestionByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns NOT_FOUND when id is empty", async () => {
    const result = await getQuestionByIdService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.question.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when question does not exist", async () => {
    mockPrisma.question.findUnique.mockResolvedValue(null);

    const result = await getQuestionByIdService({ id: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns the question with all fields when found", async () => {
    mockPrisma.question.findUnique.mockResolvedValue(baseQuestion);

    const result = await getQuestionByIdService({ id: baseQuestion.id });

    expect(result.success).toBe(true);
    expect(result.question).toMatchObject({
      id: baseQuestion.id,
      quizId: baseQuestion.quizId,
      questionText: baseQuestion.questionText,
      tags: baseQuestion.tags,
      type: baseQuestion.type,
      options: baseQuestion.options,
      correctAnswer: baseQuestion.correctAnswer,
    });
  });

  it("returns options as undefined when question has no options", async () => {
    const essayQuestion = { ...baseQuestion, type: "ESSAY", options: null, correctAnswer: null };
    mockPrisma.question.findUnique.mockResolvedValue(essayQuestion);

    const result = await getQuestionByIdService({ id: baseQuestion.id });

    expect(result.success).toBe(true);
    expect(result.question?.options).toBeUndefined();
    expect(result.question?.correctAnswer).toBeUndefined();
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.question.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getQuestionByIdService({ id: "question-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("updateQuestionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when id is missing", async () => {
    const result = await updateQuestionService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.question.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR for MULTIPLE_CHOICE without options or correctAnswer", async () => {
    const result = await updateQuestionService({
      id: "question-1",
      type: "MULTIPLE_CHOICE",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns NOT_FOUND when question does not exist", async () => {
    mockPrisma.question.findUnique.mockResolvedValue(null);

    const result = await updateQuestionService({
      id: "nonexistent",
      questionText: "Updated?",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.question.update).not.toHaveBeenCalled();
  });

  it("updates the question text without changing type or options", async () => {
    const updated = { ...baseQuestion, questionText: "Updated question?" };
    mockPrisma.question.findUnique.mockResolvedValue(baseQuestion);
    mockPrisma.question.update.mockResolvedValue(updated);

    const result = await updateQuestionService({
      id: baseQuestion.id,
      questionText: "Updated question?",
    });

    expect(result.success).toBe(true);
    expect(result.question?.questionText).toBe("Updated question?");
  });

  it("clears options and correctAnswer when switching to ESSAY type", async () => {
    const essayQuestion = { ...baseQuestion, type: "ESSAY", options: null, correctAnswer: null };
    mockPrisma.question.findUnique.mockResolvedValue(baseQuestion);
    mockPrisma.question.update.mockResolvedValue(essayQuestion);

    const result = await updateQuestionService({ id: baseQuestion.id, type: "ESSAY" });

    expect(result.success).toBe(true);
    expect(result.question?.type).toBe("ESSAY");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.question.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await updateQuestionService({ id: "question-1", questionText: "New text?" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
