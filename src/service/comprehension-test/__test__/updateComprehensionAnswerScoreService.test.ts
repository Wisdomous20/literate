import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionAnswer: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  comprehensionTest: { update: vi.fn() },
}));

const mockClassify = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../classifyComprehensionLevel", () => ({ default: mockClassify }));

import { updateComprehensionAnswerService } from "../updateComprehensionAnswerScoreService";

const existingAnswer = { id: "ans-1", comprehensionTestId: "test-1" };

describe("updateComprehensionAnswerService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when comprehensionAnswerId is empty", async () => {
    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "",
      isCorrect: true,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.comprehensionAnswer.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when isCorrect is not a boolean", async () => {
    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "ans-1",
      // @ts-expect-error intentional bad type for test
      isCorrect: "yes",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns NOT_FOUND when the answer does not exist", async () => {
    mockPrisma.comprehensionAnswer.findUnique.mockResolvedValue(null);

    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "nonexistent",
      isCorrect: true,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.comprehensionAnswer.update).not.toHaveBeenCalled();
  });

  it("recalculates the score from all answers in the test", async () => {
    mockPrisma.comprehensionAnswer.findUnique.mockResolvedValue(existingAnswer);
    mockPrisma.comprehensionAnswer.update.mockResolvedValue({ id: "ans-1", answer: "B", isCorrect: true });
    mockPrisma.comprehensionAnswer.findMany.mockResolvedValue([
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
    ]);
    mockClassify.mockReturnValue("INSTRUCTIONAL");
    mockPrisma.comprehensionTest.update.mockResolvedValue({});

    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "ans-1",
      isCorrect: true,
    });

    expect(result.success).toBe(true);
    expect(result.updatedScore).toBe(2);
  });

  it("updates classificationLevel on the comprehension test", async () => {
    mockPrisma.comprehensionAnswer.findUnique.mockResolvedValue(existingAnswer);
    mockPrisma.comprehensionAnswer.update.mockResolvedValue({ id: "ans-1", answer: "B", isCorrect: false });
    mockPrisma.comprehensionAnswer.findMany.mockResolvedValue([
      { isCorrect: false },
      { isCorrect: false },
    ]);
    mockClassify.mockReturnValue("FRUSTRATION");
    mockPrisma.comprehensionTest.update.mockResolvedValue({});

    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "ans-1",
      isCorrect: false,
    });

    expect(result.updatedLevel).toBe("FRUSTRATION");
    expect(mockPrisma.comprehensionTest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 0, classificationLevel: "FRUSTRATION" }),
      }),
    );
  });

  it("returns 0 score when answers list is empty", async () => {
    mockPrisma.comprehensionAnswer.findUnique.mockResolvedValue(existingAnswer);
    mockPrisma.comprehensionAnswer.update.mockResolvedValue({ id: "ans-1", answer: "B", isCorrect: true });
    mockPrisma.comprehensionAnswer.findMany.mockResolvedValue([]);
    mockClassify.mockReturnValue("FRUSTRATION");
    mockPrisma.comprehensionTest.update.mockResolvedValue({});

    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "ans-1",
      isCorrect: true,
    });

    expect(result.updatedScore).toBe(0);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.comprehensionAnswer.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await updateComprehensionAnswerService({
      comprehensionAnswerId: "ans-1",
      isCorrect: true,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
