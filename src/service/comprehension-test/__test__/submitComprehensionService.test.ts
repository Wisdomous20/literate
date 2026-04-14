import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  assessment: { findUnique: vi.fn() },
  comprehensionTest: { create: vi.fn() },
}));

const mockGradeEssayAnswer = vi.hoisted(() => vi.fn());
const mockClassify = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../gradeEssayService", () => ({ gradeEssayAnswer: mockGradeEssayAnswer }));
vi.mock("../classifyComprehensionLevel", () => ({ default: mockClassify }));

import { submitComprehensionService } from "../submitComprehensionService";

const mcQuestion = {
  id: "q-1",
  type: "MULTIPLE_CHOICE",
  questionText: "What is the main idea?",
  correctAnswer: "friendship",
  tags: "Literal",
};

const essayQuestion = {
  id: "q-2",
  type: "ESSAY",
  questionText: "Describe the setting.",
  correctAnswer: "A small village.",
  tags: "Inferential",
};

const makeAssessment = (questions = [mcQuestion]) => ({
  id: "assessment-1",
  passage: {
    content: "Once upon a time in a small village...",
    quiz: {
      id: "quiz-1",
      questions,
    },
  },
});

describe("submitComprehensionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClassify.mockReturnValue("INDEPENDENT");
    mockPrisma.comprehensionTest.create.mockResolvedValue({ id: "comp-test-1" });
  });

  it("returns failure when assessment or passage is not found", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "q-1", answer: "friendship" }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Assessment or passage not found.");
  });

  it("returns failure when the passage has no quiz", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue({
      id: "assessment-1",
      passage: { content: "...", quiz: null },
    });

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No quiz found for this passage.");
  });

  it("grades MULTIPLE_CHOICE answers by exact match (case-insensitive)", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(makeAssessment());

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "q-1", answer: "Friendship" }],
    });

    expect(result.success).toBe(true);
    expect(result.score).toBe(1);
  });

  it("marks MULTIPLE_CHOICE answer as incorrect on mismatch", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(makeAssessment());
    mockClassify.mockReturnValue("FRUSTRATION");

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "q-1", answer: "wrong answer" }],
    });

    expect(result.score).toBe(0);
  });

  it("delegates ESSAY answers to gradeEssayAnswer", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(
      makeAssessment([mcQuestion, essayQuestion]),
    );
    mockGradeEssayAnswer.mockResolvedValue({ isCorrect: true, reasoning: "Great." });

    await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [
        { questionId: "q-1", answer: "friendship" },
        { questionId: "q-2", answer: "A small village near the forest." },
      ],
    });

    expect(mockGradeEssayAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        questionText: essayQuestion.questionText,
        studentAnswer: "A small village near the forest.",
      }),
    );
  });

  it("marks an answer as incorrect when questionId is unknown", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(makeAssessment());
    mockClassify.mockReturnValue("FRUSTRATION");

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "unknown-q", answer: "some answer" }],
    });

    expect(result.score).toBe(0);
  });

  it("persists the comprehension test with score and level", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(makeAssessment());
    mockClassify.mockReturnValue("INDEPENDENT");

    await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "q-1", answer: "friendship" }],
    });

    const createCall = mockPrisma.comprehensionTest.create.mock.calls[0][0];
    expect(createCall.data.score).toBe(1);
    expect(createCall.data.classificationLevel).toBe("INDEPENDENT");
    expect(createCall.data.assessmentId).toBe("assessment-1");
  });

  it("returns rounded percentage, score, and level in the result", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(makeAssessment());
    mockClassify.mockReturnValue("INDEPENDENT");

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [{ questionId: "q-1", answer: "friendship" }],
    });

    expect(result.success).toBe(true);
    expect(result.percentage).toBe(100);
    expect(result.level).toBe("INDEPENDENT");
    expect(result.comprehensionTestId).toBe("comp-test-1");
  });

  it("returns failure when prisma throws", async () => {
    mockPrisma.assessment.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await submitComprehensionService({
      assessmentId: "assessment-1",
      answers: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to submit comprehension test.");
  });
});
