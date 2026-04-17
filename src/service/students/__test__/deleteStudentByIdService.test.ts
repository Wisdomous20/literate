import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { deleteStudentByIdService } from "../deleteStudentByIdService";

const archivedStudent = {
  id: "student-1",
  name: "Ana Reyes",
  level: 3,
  classRoomId: "class-1",
  archived: true,
};

describe("deleteStudentByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await deleteStudentByIdService({ userId: "", studentId: "student-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.student.findFirst).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when studentId is empty", async () => {
    const result = await deleteStudentByIdService({ userId: "user-1", studentId: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.student.findFirst).not.toHaveBeenCalled();
  });

  it("returns STUDENT_NOT_FOUND when the student does not belong to the user", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    const result = await deleteStudentByIdService({ userId: "user-1", studentId: "student-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("STUDENT_NOT_FOUND");
    expect(mockPrisma.student.update).not.toHaveBeenCalled();
  });

  it("archives the student instead of hard deleting", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });
    mockPrisma.student.update.mockResolvedValue(archivedStudent);

    await deleteStudentByIdService({ userId: "user-1", studentId: "student-1" });

    const updateCall = mockPrisma.student.update.mock.calls[0][0];
    expect(updateCall.data).toEqual({ archived: true });
  });

  it("returns the archived student on success", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });
    mockPrisma.student.update.mockResolvedValue(archivedStudent);

    const result = await deleteStudentByIdService({ userId: "user-1", studentId: "student-1" });

    expect(result.success).toBe(true);
    expect(result.student?.archived).toBe(true);
    expect(result.student?.id).toBe("student-1");
  });

  it("scopes the ownership check to the requesting userId", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });
    mockPrisma.student.update.mockResolvedValue(archivedStudent);

    await deleteStudentByIdService({ userId: "user-99", studentId: "student-1" });

    const query = mockPrisma.student.findFirst.mock.calls[0][0];
    expect(query.where).toMatchObject({ id: "student-1", classRoom: { userId: "user-99" } });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.student.findFirst.mockRejectedValue(new Error("DB down"));

    const result = await deleteStudentByIdService({ userId: "user-1", studentId: "student-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
