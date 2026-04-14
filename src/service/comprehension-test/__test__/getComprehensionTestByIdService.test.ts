import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionTest: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getComprehensionTestByIdService } from "../getComprehensionTestByIdService";

const baseTest = {
  id: "test-1",
  score: 8,
  totalItems: 10,
  classificationLevel: "INDEPENDENT",
  assessment: {
    id: "assessment-1",
    student: { id: "student-1", name: "Ana Reyes" },
    passage: { id: "passage-1", title: "The Ant and the Grasshopper" },
  },
  answers: [],
};

describe("getComprehensionTestByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when no test is found for the given id", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(null);

    await expect(getComprehensionTestByIdService("nonexistent")).rejects.toThrow(
      "ComprehensionTest with id nonexistent not found",
    );
  });

  it("returns the comprehension test with nested assessment and answers", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(baseTest);

    const result = await getComprehensionTestByIdService("test-1");

    expect(result.id).toBe("test-1");
    expect(result.assessment.student.name).toBe("Ana Reyes");
  });

  it("queries by id using include for assessment and answers", async () => {
    mockPrisma.comprehensionTest.findUnique.mockResolvedValue(baseTest);

    await getComprehensionTestByIdService("test-1");

    const query = mockPrisma.comprehensionTest.findUnique.mock.calls[0][0];
    expect(query.where).toEqual({ id: "test-1" });
    expect(query.include).toBeDefined();
  });

  it("propagates prisma errors", async () => {
    mockPrisma.comprehensionTest.findUnique.mockRejectedValue(new Error("DB down"));

    await expect(getComprehensionTestByIdService("test-1")).rejects.toThrow("DB down");
  });
});
