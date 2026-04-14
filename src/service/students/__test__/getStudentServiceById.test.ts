import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getStudentServiceById } from "../getStudentServiceById";

const baseStudent = {
  id: "student-1",
  name: "Ana Reyes",
  classRoomId: "class-1",
  level: 3,
  assessments: [],
};

describe("getStudentServiceById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns STUDENT_NOT_FOUND when no matching student exists", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    const result = await getStudentServiceById("user-1", "nonexistent");

    expect(result.success).toBe(false);
    expect(result.code).toBe("STUDENT_NOT_FOUND");
  });

  it("returns the student with assessments on success", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(baseStudent);

    const result = await getStudentServiceById("user-1", "student-1");

    expect(result.success).toBe(true);
    expect(result.student).toMatchObject({ id: "student-1", name: "Ana Reyes" });
  });

  it("scopes the query to the requesting user's classes", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(baseStudent);

    await getStudentServiceById("user-99", "student-1");

    const query = mockPrisma.student.findFirst.mock.calls[0][0];
    expect(query.where).toMatchObject({
      id: "student-1",
      classRoom: { userId: "user-99" },
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.student.findFirst.mockRejectedValue(new Error("DB down"));

    const result = await getStudentServiceById("user-1", "student-1");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
