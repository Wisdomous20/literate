import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionResult: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getComprehensionResultByAssessmentService } from "../getComprehensionResultByAssessmentService";

const baseTest = {
  id: "test-1",
  score: 7,
  totalItems: 10,
  classificationLevel: "INSTRUCTIONAL",
  assessment: {
    id: "assessment-1",
    student: { id: "student-1", name: "Ben Cruz" },
    passage: { id: "passage-1", title: "The Lion and the Mouse" },
  },
  answers: [{ id: "ans-1", answer: "A", isCorrect: true }],
};

describe("getComprehensionResultByAssessmentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when no test is found for the given assessmentId", async () => {
    mockPrisma.comprehensionResult.findUnique.mockResolvedValue(null);

    await expect(
      getComprehensionResultByAssessmentService("nonexistent"),
    ).rejects.toThrow("ComprehensionResult for assessment nonexistent not found");
  });

  it("returns the test with nested assessment and answers when found", async () => {
    mockPrisma.comprehensionResult.findUnique.mockResolvedValue(baseTest);

    const result = await getComprehensionResultByAssessmentService("assessment-1");

    expect(result.id).toBe("test-1");
    expect(result.answers).toHaveLength(1);
  });

  it("queries by assessmentId", async () => {
    mockPrisma.comprehensionResult.findUnique.mockResolvedValue(baseTest);

    await getComprehensionResultByAssessmentService("assessment-1");

    const query = mockPrisma.comprehensionResult.findUnique.mock.calls[0][0];
    expect(query.where).toEqual({ assessmentId: "assessment-1" });
  });

  it("propagates prisma errors", async () => {
    mockPrisma.comprehensionResult.findUnique.mockRejectedValue(new Error("DB down"));

    await expect(
      getComprehensionResultByAssessmentService("assessment-1"),
    ).rejects.toThrow("DB down");
  });
});
