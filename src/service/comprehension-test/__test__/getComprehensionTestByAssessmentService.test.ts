import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionTest: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getComprehensionTestByAssessmentService } from "../getComprehensionTestByAssessmentService";

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

describe("getComprehensionTestByAssessmentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when no test is found for the given assessmentId", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(null);

    await expect(
      getComprehensionTestByAssessmentService("nonexistent"),
    ).rejects.toThrow("ComprehensionTest for assessment nonexistent not found");
  });

  it("returns the test with nested assessment and answers when found", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(baseTest);

    const result = await getComprehensionTestByAssessmentService("assessment-1");

    expect(result.id).toBe("test-1");
    expect(result.answers).toHaveLength(1);
  });

  it("queries by assessmentId", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(baseTest);

    await getComprehensionTestByAssessmentService("assessment-1");

    const query = mockPrisma.comprehensionTest.findUnique.mock.calls[0][0];
    expect(query.where).toEqual({ assessmentId: "assessment-1" });
  });

  it("propagates prisma errors", async () => {
    mockPrisma.comprehensionTest.findUnique.mockRejectedValue(new Error("DB down"));

    await expect(
      getComprehensionTestByAssessmentService("assessment-1"),
    ).rejects.toThrow("DB down");
  });
});
