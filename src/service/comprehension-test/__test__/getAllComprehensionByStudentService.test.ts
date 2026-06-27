import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionResult: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getAllComprehensionResultsByStudentIdService } from "../getAllComprehensionByStudentService";

const makeTest = (id: string, dateTaken: Date) => ({
  id,
  score: 8,
  totalItems: 10,
  classificationLevel: "INDEPENDENT",
  assessment: {
    id: `assessment-${id}`,
    dateTaken,
    passage: { id: "passage-1", title: "The Fox" },
  },
  answers: [],
});

describe("getAllComprehensionResultsByStudentIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an empty array when the student has no tests", async () => {
    mockPrisma.comprehensionResult.findMany.mockResolvedValue([]);

    const result = await getAllComprehensionResultsByStudentIdService("student-1");

    expect(result).toHaveLength(0);
  });

  it("returns all tests for the given student", async () => {
    const tests = [
      makeTest("test-1", new Date("2024-03-01")),
      makeTest("test-2", new Date("2024-02-01")),
    ];
    mockPrisma.comprehensionResult.findMany.mockResolvedValue(tests);

    const result = await getAllComprehensionResultsByStudentIdService("student-1");

    expect(result).toHaveLength(2);
  });

  it("filters by studentId via the nested assessment relation", async () => {
    mockPrisma.comprehensionResult.findMany.mockResolvedValue([]);

    await getAllComprehensionResultsByStudentIdService("student-99");

    const query = mockPrisma.comprehensionResult.findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({ assessment: { studentId: "student-99" } });
  });

  it("orders results by dateTaken descending", async () => {
    mockPrisma.comprehensionResult.findMany.mockResolvedValue([]);

    await getAllComprehensionResultsByStudentIdService("student-1");

    const query = mockPrisma.comprehensionResult.findMany.mock.calls[0][0];
    expect(query.orderBy).toMatchObject({ assessment: { dateTaken: "desc" } });
  });

  it("propagates prisma errors", async () => {
    mockPrisma.comprehensionResult.findMany.mockRejectedValue(new Error("DB down"));

    await expect(
      getAllComprehensionResultsByStudentIdService("student-1"),
    ).rejects.toThrow("DB down");
  });
});
