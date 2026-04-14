import { beforeEach, describe, expect, it, vi } from "vitest";
import { testType } from "@/generated/prisma/enums";

const mockPrisma = vi.hoisted(() => ({
  passage: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { createPassageService } from "../createPassageService";
import { deletePassageService } from "../deletePassageService";
import { getAllPassageService } from "../getAllPassageService";
import { getPassageByIdService } from "../getPassageByIdService";
import { updatePassageService } from "../UpdatePassageService";

const basePassage = {
  id: "passage-1",
  title: "The Fox",
  content: "Once upon a time...",
  language: "English",
  level: 3,
  testType: testType.PRE_TEST,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
};

describe("createPassageService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when any required field is missing", async () => {
    const result = await createPassageService({
      title: "",
      content: "Some content",
      language: "English",
      level: 1,
      testType: testType.PRE_TEST,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.passage.create).not.toHaveBeenCalled();
  });

  it("creates and returns the passage on valid input", async () => {
    mockPrisma.passage.create.mockResolvedValue(basePassage);

    const result = await createPassageService({
      title: basePassage.title,
      content: basePassage.content,
      language: basePassage.language,
      level: basePassage.level,
      testType: basePassage.testType,
    });

    expect(result.success).toBe(true);
    expect(result.passage).toMatchObject({
      id: basePassage.id,
      title: basePassage.title,
      testType: basePassage.testType,
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.passage.create.mockRejectedValue(new Error("DB down"));

    const result = await createPassageService({
      title: "Title",
      content: "Content",
      language: "English",
      level: 2,
      testType: testType.PRE_TEST,
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("deletePassageService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns NOT_FOUND when id is empty", async () => {
    const result = await deletePassageService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.passage.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when passage does not exist", async () => {
    mockPrisma.passage.findUnique.mockResolvedValue(null);

    const result = await deletePassageService({ id: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.passage.delete).not.toHaveBeenCalled();
  });

  it("deletes the passage and returns success", async () => {
    mockPrisma.passage.findUnique.mockResolvedValue(basePassage);
    mockPrisma.passage.delete.mockResolvedValue(basePassage);

    const result = await deletePassageService({ id: basePassage.id });

    expect(result.success).toBe(true);
    expect(mockPrisma.passage.delete).toHaveBeenCalledWith({
      where: { id: basePassage.id },
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.passage.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await deletePassageService({ id: "passage-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("getAllPassageService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all passages on success", async () => {
    const passages = [basePassage, { ...basePassage, id: "passage-2" }];
    mockPrisma.passage.findMany.mockResolvedValue(passages);

    const result = await getAllPassageService();

    expect(result.success).toBe(true);
    expect(result.passages).toHaveLength(2);
  });

  it("returns an empty array when no passages exist", async () => {
    mockPrisma.passage.findMany.mockResolvedValue([]);

    const result = await getAllPassageService();

    expect(result.success).toBe(true);
    expect(result.passages).toHaveLength(0);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.passage.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getAllPassageService();

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("getPassageByIdService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns NOT_FOUND when id is empty", async () => {
    const result = await getPassageByIdService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.passage.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when passage does not exist", async () => {
    mockPrisma.passage.findUnique.mockResolvedValue(null);

    const result = await getPassageByIdService({ id: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns the passage when found", async () => {
    mockPrisma.passage.findUnique.mockResolvedValue(basePassage);

    const result = await getPassageByIdService({ id: basePassage.id });

    expect(result.success).toBe(true);
    expect(result.passage?.id).toBe(basePassage.id);
    expect(result.passage?.title).toBe(basePassage.title);
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.passage.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getPassageByIdService({ id: "passage-1" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("updatePassageService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when id is missing", async () => {
    const result = await updatePassageService({ id: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.passage.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when passage does not exist", async () => {
    mockPrisma.passage.findUnique.mockResolvedValue(null);

    const result = await updatePassageService({ id: "nonexistent", title: "New Title" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
    expect(mockPrisma.passage.update).not.toHaveBeenCalled();
  });

  it("updates and returns the passage on success", async () => {
    const updated = { ...basePassage, title: "Updated Title" };
    mockPrisma.passage.findUnique.mockResolvedValue(basePassage);
    mockPrisma.passage.update.mockResolvedValue(updated);

    const result = await updatePassageService({ id: basePassage.id, title: "Updated Title" });

    expect(result.success).toBe(true);
    expect(result.passage?.title).toBe("Updated Title");
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.passage.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await updatePassageService({ id: "passage-1", title: "Title" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
