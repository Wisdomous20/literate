import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  classRoom: { findFirst: vi.fn() },
  student: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
}));

const mockHasActiveSubscription = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/utils/subscriptionCheck", () => ({
  hasActiveSubscription: mockHasActiveSubscription,
}));

import { createStudentService } from "../createStudentService";

const baseInput = {
  name: "Ana Reyes",
  level: 3,
  userId: "user-1",
  className: "Grade 3 - A",
  schoolYear: "2025-2026",
};

const baseClass = { id: "class-1", name: "Grade 3 - A", userId: "user-1", schoolYear: "2025-2026" };
const baseStudent = { id: "student-1", name: "Ana Reyes", level: 3, classRoomId: "class-1" };

describe("createStudentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to a paid user so the free-tier gate is skipped unless overridden.
    mockHasActiveSubscription.mockResolvedValue(true);
    mockPrisma.student.count.mockResolvedValue(0);
  });

  it("returns VALIDATION_ERROR when name is empty", async () => {
    const result = await createStudentService({ ...baseInput, name: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findFirst).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when name is only whitespace", async () => {
    const result = await createStudentService({ ...baseInput, name: "   " });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await createStudentService({ ...baseInput, userId: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when className is empty", async () => {
    const result = await createStudentService({ ...baseInput, className: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when schoolYear is empty", async () => {
    const result = await createStudentService({ ...baseInput, schoolYear: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns CLASS_NOT_FOUND when no matching class exists", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(null);

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe("CLASS_NOT_FOUND");
    expect(mockPrisma.student.create).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when the student already exists in the class", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.error).toMatch(/already exists/);
    expect(mockPrisma.student.create).not.toHaveBeenCalled();
  });

  it("creates and returns the student on success", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue(baseStudent);

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(true);
    expect(result.student).toMatchObject({ id: "student-1", name: "Ana Reyes", level: 3 });
  });

  it("trims the student name before storing", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue(baseStudent);

    await createStudentService({ ...baseInput, name: "  Ana Reyes  " });

    const createCall = mockPrisma.student.create.mock.calls[0][0];
    expect(createCall.data.name).toBe("Ana Reyes");
  });

  it("looks up the class using the trimmed className and schoolYear", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue(baseStudent);

    await createStudentService({ ...baseInput, className: "  Grade 3 - A  ", schoolYear: "  2025-2026  " });

    const classQuery = mockPrisma.classRoom.findFirst.mock.calls[0][0];
    expect(classQuery.where.name).toBe("Grade 3 - A");
    expect(classQuery.where.schoolYear).toBe("2025-2026");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.findFirst.mockRejectedValue(new Error("DB down"));

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("blocks a free user who already has 1 student", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.count.mockResolvedValue(1);

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(false);
    expect(result.code).toBe("FREE_LIMIT_REACHED");
    expect(result.error).toBe(
      "Free users can only have one student. Upgrade to add more.",
    );
    expect(mockPrisma.student.create).not.toHaveBeenCalled();
    expect(mockPrisma.student.count).toHaveBeenCalledWith({
      where: { classRoom: { userId: "user-1" } },
    });
  });

  it("allows a free user's first student (0 → 1)", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.count.mockResolvedValue(0);
    mockPrisma.student.create.mockResolvedValue(baseStudent);

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(true);
  });

  it("does not gate a paid user regardless of student count", async () => {
    mockHasActiveSubscription.mockResolvedValue(true);
    mockPrisma.classRoom.findFirst.mockResolvedValue(baseClass);
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.count.mockResolvedValue(99);
    mockPrisma.student.create.mockResolvedValue(baseStudent);

    const result = await createStudentService(baseInput);

    expect(result.success).toBe(true);
  });
});
