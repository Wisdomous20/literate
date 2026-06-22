import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  assessment: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getClassificationDistribution } from "../getClassificationDistribution";

function assessment(
  id: string,
  studentId: string,
  type: "ORAL_READING" | "READING_FLUENCY" | "COMPREHENSION",
  level: "INDEPENDENT" | "INSTRUCTIONAL" | "FRUSTRATION" | null,
) {
  return {
    id,
    studentId,
    type,
    oralReadingResult:
      type === "ORAL_READING" ? { classificationLevel: level } : null,
    oralFluency:
      type === "READING_FLUENCY"
        ? { classificationLevel: level, deletedAt: null }
        : null,
    comprehension:
      type === "COMPREHENSION" ? { classificationLevel: level } : null,
  };
}

describe("getClassificationDistribution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts only each student's latest matching assessment", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([
      assessment("a-3", "student-1", "ORAL_READING", "FRUSTRATION"),
      assessment("a-2", "student-2", "READING_FLUENCY", "INDEPENDENT"),
      assessment("a-1", "student-1", "COMPREHENSION", "INSTRUCTIONAL"),
    ]);

    await expect(
      getClassificationDistribution("user-1", "2025-2026", "ALL", "PRE"),
    ).resolves.toEqual({
      independent: 1,
      instructional: 0,
      frustration: 1,
    });
  });

  it("scopes the distribution to the selected grade and filters", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([]);

    await getClassificationDistribution(
      "user-1",
      "2025-2026",
      "COMPREHENSION",
      "POST",
      5,
    );

    expect(mockPrisma.assessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "COMPREHENSION",
          passage: { testType: "POST_TEST" },
          student: expect.objectContaining({
            archived: false,
            level: 5,
            classRoom: {
              userId: "user-1",
              schoolYear: "2025-2026",
              archived: false,
            },
          }),
        }),
      }),
    );
  });
});
