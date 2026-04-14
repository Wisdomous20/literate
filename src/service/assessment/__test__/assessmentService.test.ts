import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findUnique: vi.fn() },
  assessment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
}));

const mockCheckDailyLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/service/assessment/checkDailyLimitService", () => ({
  checkDailyLimit: mockCheckDailyLimit,
}));

import { createAssessmentService } from "../createAssessmentService";
import { getAssessmentsByStudentService } from "../getAssessmentsByStudentService";
import { getAssessmentByIdService } from "../getAssessmentByIdService";
import { getRecentAssessmentsService } from "../getRecentAssessmentsService";
import { getAssessmentComprehensionService } from "../getAssessmentComprehensionService";

const baseAssessment = {
  id: "assessment-1",
  studentId: "student-1",
  type: "COMPREHENSION",
  passageId: "passage-1",
  dateTaken: new Date("2024-03-01"),
};

const baseStudent = {
  id: "student-1",
  name: "Juan dela Cruz",
  level: 3,
  classRoomId: "class-1",
  classRoom: { userId: "user-1" },
};

const makeAssessment = (
  type: string,
  classification: string | null,
  id = "a-1",
) => ({
  id,
  type,
  dateTaken: new Date("2024-03-01"),
  student: { id: "student-1", name: "Juan", classRoomId: "class-1" },
  oralReadingResult:
    type === "ORAL_READING" ? { classificationLevel: classification } : null,
  oralFluency:
    type === "READING_FLUENCY" ? { classificationLevel: classification } : null,
  comprehension:
    type === "COMPREHENSION" ? { classificationLevel: classification } : null,
});

// ─── createAssessmentService ─────────────────────────────────────────────────

describe("createAssessmentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when any required field is missing", async () => {
    const result = await createAssessmentService({
      studentId: "",
      type: "COMPREHENSION",
      passageId: "passage-1",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.student.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when student does not exist", async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);

    const result = await createAssessmentService({
      studentId: "nonexistent",
      type: "COMPREHENSION",
      passageId: "passage-1",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.assessment.create).not.toHaveBeenCalled();
  });

  it("returns DAILY_LIMIT_REACHED when the daily limit check fails", async () => {
    mockPrisma.student.findUnique.mockResolvedValue(baseStudent);
    mockCheckDailyLimit.mockResolvedValue({
      allowed: false,
      reason: "Daily limit reached for comprehension.",
    });

    const result = await createAssessmentService({
      studentId: "student-1",
      type: "COMPREHENSION",
      passageId: "passage-1",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("DAILY_LIMIT_REACHED");
    expect(mockPrisma.assessment.create).not.toHaveBeenCalled();
  });

  it("creates and returns the assessment when limit check passes", async () => {
    mockPrisma.student.findUnique.mockResolvedValue(baseStudent);
    mockCheckDailyLimit.mockResolvedValue({ allowed: true });
    mockPrisma.assessment.create.mockResolvedValue(baseAssessment);

    const result = await createAssessmentService({
      studentId: "student-1",
      type: "COMPREHENSION",
      passageId: "passage-1",
    });

    expect(result.success).toBe(true);
    expect(result.assessment).toMatchObject({
      id: baseAssessment.id,
      studentId: baseAssessment.studentId,
      type: baseAssessment.type,
      passageId: baseAssessment.passageId,
    });
  });

  it("passes the student's classroom userId to checkDailyLimit", async () => {
    mockPrisma.student.findUnique.mockResolvedValue(baseStudent);
    mockCheckDailyLimit.mockResolvedValue({ allowed: true });
    mockPrisma.assessment.create.mockResolvedValue(baseAssessment);

    await createAssessmentService({
      studentId: "student-1",
      type: "ORAL_READING",
      passageId: "passage-1",
    });

    expect(mockCheckDailyLimit).toHaveBeenCalledWith("user-1", "ORAL_READING");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.student.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await createAssessmentService({
      studentId: "student-1",
      type: "COMPREHENSION",
      passageId: "passage-1",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── getAssessmentsByStudentService ──────────────────────────────────────────

describe("getAssessmentsByStudentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all assessments for a student", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([baseAssessment]);

    const result = await getAssessmentsByStudentService({ studentId: "student-1" });

    expect(result.success).toBe(true);
    expect(result.assessments).toHaveLength(1);
  });

  it("filters by type when type is provided", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([baseAssessment]);

    await getAssessmentsByStudentService({ studentId: "student-1", type: "COMPREHENSION" });

    const callArgs = mockPrisma.assessment.findMany.mock.calls[0][0];
    expect(callArgs.where.type).toBe("COMPREHENSION");
  });

  it("applies no filters when called with an empty input", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([baseAssessment]);

    await getAssessmentsByStudentService({});

    const callArgs = mockPrisma.assessment.findMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({});
  });

  it("returns an empty array when no assessments exist", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([]);

    const result = await getAssessmentsByStudentService({ studentId: "student-1" });

    expect(result.success).toBe(true);
    expect(result.assessments).toHaveLength(0);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.assessment.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getAssessmentsByStudentService({ studentId: "student-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── getAssessmentByIdService ─────────────────────────────────────────────────

describe("getAssessmentByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when id is empty", async () => {
    const result = await getAssessmentByIdService("");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.assessment.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when assessment does not exist", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const result = await getAssessmentByIdService("nonexistent");

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns the assessment when found", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(baseAssessment);

    const result = await getAssessmentByIdService("assessment-1");

    expect(result.success).toBe(true);
    expect(result.assessment).toMatchObject({ id: baseAssessment.id });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.assessment.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getAssessmentByIdService("assessment-1");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── getRecentAssessmentsService ──────────────────────────────────────────────

describe("getRecentAssessmentsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only FRUSTRATION and INSTRUCTIONAL assessments", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([
      makeAssessment("ORAL_READING", "FRUSTRATION", "a-1"),
      makeAssessment("COMPREHENSION", "INDEPENDENT", "a-2"),
      makeAssessment("READING_FLUENCY", "INSTRUCTIONAL", "a-3"),
    ]);

    const result = await getRecentAssessmentsService("user-1", "2024-2025");

    expect(result.success).toBe(true);
    expect(result.assessments).toHaveLength(2);
    expect(result.assessments?.map((a) => a.id)).toEqual(["a-1", "a-3"]);
  });

  it("returns at most 4 assessments", async () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makeAssessment("ORAL_READING", "FRUSTRATION", `a-${i}`),
    );
    mockPrisma.assessment.findMany.mockResolvedValue(many);

    const result = await getRecentAssessmentsService("user-1", "2024-2025");

    expect(result.assessments).toHaveLength(4);
  });

  it("returns an empty array when no assessments meet the threshold", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([
      makeAssessment("COMPREHENSION", "INDEPENDENT", "a-1"),
    ]);

    const result = await getRecentAssessmentsService("user-1", "2024-2025");

    expect(result.success).toBe(true);
    expect(result.assessments).toHaveLength(0);
  });

  it("correctly reads classificationLevel from each assessment type", async () => {
    mockPrisma.assessment.findMany.mockResolvedValue([
      makeAssessment("ORAL_READING", "FRUSTRATION", "a-1"),
      makeAssessment("READING_FLUENCY", "INSTRUCTIONAL", "a-2"),
      makeAssessment("COMPREHENSION", "FRUSTRATION", "a-3"),
    ]);

    const result = await getRecentAssessmentsService("user-1", "2024-2025");

    expect(result.assessments?.map((a) => a.assessmentType)).toEqual([
      "ORAL_READING",
      "READING_FLUENCY",
      "COMPREHENSION",
    ]);
  });

  it("returns failure when prisma throws", async () => {
    mockPrisma.assessment.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getRecentAssessmentsService("user-1", "2024-2025");

    expect(result.success).toBe(false);
  });
});

// ─── getAssessmentComprehensionService ────────────────────────────────────────

describe("getAssessmentComprehensionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when assessmentId is empty", async () => {
    const result = await getAssessmentComprehensionService("");

    expect(result.success).toBe(false);
    expect(mockPrisma.assessment.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when assessment does not exist", async () => {
    mockPrisma.assessment.findUnique.mockResolvedValue(null);

    const result = await getAssessmentComprehensionService("nonexistent");

    expect(result.success).toBe(false);
  });

  it("returns the assessment with comprehension data when found", async () => {
    const data = {
      id: "assessment-1",
      oralFluency: { classificationLevel: "INDEPENDENT" },
      comprehension: {
        id: "comp-1",
        score: 8,
        totalItems: 10,
        classificationLevel: "INDEPENDENT",
        answers: [],
      },
    };
    mockPrisma.assessment.findUnique.mockResolvedValue(data);

    const result = await getAssessmentComprehensionService("assessment-1");

    expect(result.success).toBe(true);
    expect(result.assessment).toMatchObject({ id: "assessment-1" });
  });

  it("returns failure when prisma throws", async () => {
    mockPrisma.assessment.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getAssessmentComprehensionService("assessment-1");

    expect(result.success).toBe(false);
  });
});
