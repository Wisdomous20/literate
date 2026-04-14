import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  comprehensionTest: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getAllComprehensionTestsByStudentIdService } from "../getAllComprehensionByStudentService";

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

describe("getAllComprehensionTestsByStudentIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an empty array when the student has no tests", async () => {
    mockPrisma.comprehensionTest.findMany.mockResolvedValue([]);

    const result = await getAllComprehensionTestsByStudentIdService("student-1");

    expect(result).toHaveLength(0);
  });

  it("returns all tests for the given student", async () => {
    const tests = [
      makeTest("test-1", new Date("2024-03-01")),
      makeTest("test-2", new Date("2024-02-01")),
    ];
    mockPrisma.comprehensionTest.findMany.mockResolvedValue(tests);

    const result = await getAllComprehensionTestsByStudentIdService("student-1");

    expect(result).toHaveLength(2);
  });

  it("filters by studentId via the nested assessment relation", async () => {
    mockPrisma.comprehensionTest.findMany.mockResolvedValue([]);

    await getAllComprehensionTestsByStudentIdService("student-99");

    const query = mockPrisma.comprehensionTest.findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({ assessment: { studentId: "student-99" } });
  });

  it("orders results by dateTaken descending", async () => {
    mockPrisma.comprehensionTest.findMany.mockResolvedValue([]);

    await getAllComprehensionTestsByStudentIdService("student-1");

    const query = mockPrisma.comprehensionTest.findMany.mock.calls[0][0];
    expect(query.orderBy).toMatchObject({ assessment: { dateTaken: "desc" } });
  });

  it("propagates prisma errors", async () => {
    mockPrisma.comprehensionTest.findMany.mockRejectedValue(new Error("DB down"));

    await expect(
      getAllComprehensionTestsByStudentIdService("student-1"),
    ).rejects.toThrow("DB down");
  });
});
