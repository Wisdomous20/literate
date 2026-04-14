import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getStudentsByClassNameService } from "../getAllStudentByClassService";

const baseStudents = [
  { id: "student-1", name: "Ana Reyes", classRoomId: "class-1", level: 3 },
  { id: "student-2", name: "Ben Cruz", classRoomId: "class-1", level: 2 },
];

describe("getStudentsByClassNameService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all active students for the given class and user", async () => {
    mockPrisma.student.findMany.mockResolvedValue(baseStudents);

    const result = await getStudentsByClassNameService("user-1", "Grade 3 - A");

    expect(result.success).toBe(true);
    expect(result.students).toHaveLength(2);
  });

  it("returns an empty array when the class has no active students", async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    const result = await getStudentsByClassNameService("user-1", "Grade 3 - A");

    expect(result.success).toBe(true);
    expect(result.students).toHaveLength(0);
  });

  it("filters only non-archived students", async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    await getStudentsByClassNameService("user-1", "Grade 3 - A");

    const query = mockPrisma.student.findMany.mock.calls[0][0];
    expect(query.where.archived).toBe(false);
  });

  it("scopes the query to the requesting userId and className", async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    await getStudentsByClassNameService("user-99", "Grade 4 - B");

    const query = mockPrisma.student.findMany.mock.calls[0][0];
    expect(query.where.classRoom).toMatchObject({ name: "Grade 4 - B", userId: "user-99" });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.student.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getStudentsByClassNameService("user-1", "Grade 3 - A");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
