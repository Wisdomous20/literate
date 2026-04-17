import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  classRoom: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

const mockGetSchoolYear = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/utils/getSchoolYear", () => ({ getSchoolYear: mockGetSchoolYear }));

import { createClassService } from "../createClassService";
import { getClassByIdService } from "../getClassByIdService";
import { getAllClassServiceBySchoolYear } from "../getAllClassServiceBySchoolYear";
import { updateClassService } from "../updateClassService";
import { deleteClassService } from "../deleteClassService";

const baseClass = {
  id: "class-1",
  name: "Grade 3 - Section A",
  userId: "user-1",
  schoolYear: "2025-2026",
  archived: false,
  createdAt: new Date("2025-08-01"),
};

const baseStudents = [
  { id: "student-1", name: "Ana Reyes", level: 3, classRoomId: "class-1", archived: false },
  { id: "student-2", name: "Ben Cruz", level: 2, classRoomId: "class-1", archived: false },
];

// ─── createClassService ───────────────────────────────────────────────────────

describe("createClassService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSchoolYear.mockReturnValue("2025-2026");
  });

  it("returns VALIDATION_ERROR when name is empty", async () => {
    const result = await createClassService({ name: "", userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.create).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when name is only whitespace", async () => {
    const result = await createClassService({ name: "   ", userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await createClassService({ name: "Grade 3", userId: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.create).not.toHaveBeenCalled();
  });

  it("trims the name before storing", async () => {
    mockPrisma.classRoom.create.mockResolvedValue(baseClass);

    await createClassService({ name: "  Grade 3  ", userId: "user-1" });

    const createCall = mockPrisma.classRoom.create.mock.calls[0][0];
    expect(createCall.data.name).toBe("Grade 3");
  });

  it("stores the school year from getSchoolYear", async () => {
    mockPrisma.classRoom.create.mockResolvedValue(baseClass);

    await createClassService({ name: "Grade 3", userId: "user-1" });

    const createCall = mockPrisma.classRoom.create.mock.calls[0][0];
    expect(createCall.data.schoolYear).toBe("2025-2026");
  });

  it("returns the created class on success", async () => {
    mockPrisma.classRoom.create.mockResolvedValue(baseClass);

    const result = await createClassService({ name: "Grade 3 - Section A", userId: "user-1" });

    expect(result.success).toBe(true);
    expect(result.class).toMatchObject({ id: "class-1", name: "Grade 3 - Section A" });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.create.mockRejectedValue(new Error("DB down"));

    const result = await createClassService({ name: "Grade 3", userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── getClassByIdService ──────────────────────────────────────────────────────

describe("getClassByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when classRoomId is empty", async () => {
    const result = await getClassByIdService("");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when no class matches the id", async () => {
    mockPrisma.classRoom.findUnique.mockResolvedValue(null);

    const result = await getClassByIdService("nonexistent");

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns the class with its students on success", async () => {
    mockPrisma.classRoom.findUnique.mockResolvedValue({
      ...baseClass,
      students: baseStudents,
    });

    const result = await getClassByIdService("class-1");

    expect(result.success).toBe(true);
    expect(result.classItem).toMatchObject({ id: "class-1", name: "Grade 3 - Section A" });
    expect(result.classItem?.students).toHaveLength(2);
  });

  it("only queries active (non-archived) students", async () => {
    mockPrisma.classRoom.findUnique.mockResolvedValue({ ...baseClass, students: [] });

    await getClassByIdService("class-1");

    const query = mockPrisma.classRoom.findUnique.mock.calls[0][0];
    expect(query.select.students.where).toMatchObject({ archived: false });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getClassByIdService("class-1");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── getAllClassServiceBySchoolYear ───────────────────────────────────────────

describe("getAllClassServiceBySchoolYear", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await getAllClassServiceBySchoolYear("", "2025-2026");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findMany).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when schoolYear is empty", async () => {
    const result = await getAllClassServiceBySchoolYear("user-1", "");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findMany).not.toHaveBeenCalled();
  });

  it("only queries non-archived classes for the given user and school year", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([]);

    await getAllClassServiceBySchoolYear("user-1", "2025-2026");

    const query = mockPrisma.classRoom.findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({ userId: "user-1", schoolYear: "2025-2026", archived: false });
  });

  it("maps _count.students into studentCount on each result", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([
      { ...baseClass, _count: { students: 5 } },
      { ...baseClass, id: "class-2", name: "Grade 4", _count: { students: 3 } },
    ]);

    const result = await getAllClassServiceBySchoolYear("user-1", "2025-2026");

    expect(result.success).toBe(true);
    expect(result.classes?.[0].studentCount).toBe(5);
    expect(result.classes?.[1].studentCount).toBe(3);
  });

  it("returns an empty array when no classes exist", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([]);

    const result = await getAllClassServiceBySchoolYear("user-1", "2025-2026");

    expect(result.success).toBe(true);
    expect(result.classes).toHaveLength(0);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getAllClassServiceBySchoolYear("user-1", "2025-2026");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── updateClassService ───────────────────────────────────────────────────────

describe("updateClassService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await updateClassService({ userId: "", classRoomId: "class-1", name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when classRoomId is empty", async () => {
    const result = await updateClassService({ userId: "user-1", classRoomId: "", name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when name is provided but empty", async () => {
    const result = await updateClassService({ userId: "user-1", classRoomId: "class-1", name: "   " });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when neither name nor archived is provided", async () => {
    const result = await updateClassService({ userId: "user-1", classRoomId: "class-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns CLASS_NOT_FOUND when class does not belong to the user", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(null);

    const result = await updateClassService({
      userId: "user-1",
      classRoomId: "class-1",
      name: "New Name",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("CLASS_NOT_FOUND");
    expect(mockPrisma.classRoom.update).not.toHaveBeenCalled();
  });

  it("trims the name before storing", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue({ id: "class-1" });
    mockPrisma.classRoom.update.mockResolvedValue({ ...baseClass, name: "New Name" });

    await updateClassService({ userId: "user-1", classRoomId: "class-1", name: "  New Name  " });

    const updateCall = mockPrisma.classRoom.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe("New Name");
  });

  it("updates archived flag when provided", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue({ id: "class-1" });
    mockPrisma.classRoom.update.mockResolvedValue({ ...baseClass, archived: true });

    await updateClassService({ userId: "user-1", classRoomId: "class-1", archived: true });

    const updateCall = mockPrisma.classRoom.update.mock.calls[0][0];
    expect(updateCall.data.archived).toBe(true);
    expect(updateCall.data.name).toBeUndefined();
  });

  it("returns the updated class on success", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue({ id: "class-1" });
    mockPrisma.classRoom.update.mockResolvedValue({ ...baseClass, name: "Updated Name" });

    const result = await updateClassService({
      userId: "user-1",
      classRoomId: "class-1",
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
    expect(result.class?.name).toBe("Updated Name");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.findFirst.mockRejectedValue(new Error("DB down"));

    const result = await updateClassService({
      userId: "user-1",
      classRoomId: "class-1",
      name: "New Name",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── deleteClassService ───────────────────────────────────────────────────────

describe("deleteClassService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when userId is empty", async () => {
    const result = await deleteClassService({ userId: "", classRoomId: "class-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findFirst).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when classRoomId is empty", async () => {
    const result = await deleteClassService({ userId: "user-1", classRoomId: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.classRoom.findFirst).not.toHaveBeenCalled();
  });

  it("returns CLASS_NOT_FOUND when class does not belong to the user", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue(null);

    const result = await deleteClassService({ userId: "user-1", classRoomId: "class-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("CLASS_NOT_FOUND");
    expect(mockPrisma.classRoom.update).not.toHaveBeenCalled();
  });

  it("archives the class instead of hard deleting it", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue({ id: "class-1" });
    mockPrisma.classRoom.update.mockResolvedValue({ id: "class-1" });

    await deleteClassService({ userId: "user-1", classRoomId: "class-1" });

    const updateCall = mockPrisma.classRoom.update.mock.calls[0][0];
    expect(updateCall.data).toMatchObject({ archived: true });
  });

  it("returns the archived class id on success", async () => {
    mockPrisma.classRoom.findFirst.mockResolvedValue({ id: "class-1" });
    mockPrisma.classRoom.update.mockResolvedValue({ id: "class-1" });

    const result = await deleteClassService({ userId: "user-1", classRoomId: "class-1" });

    expect(result.success).toBe(true);
    expect(result.id).toBe("class-1");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.classRoom.findFirst.mockRejectedValue(new Error("DB down"));

    const result = await deleteClassService({ userId: "user-1", classRoomId: "class-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
