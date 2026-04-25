import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
  oralFluencyBehavior: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
};

const mockPrisma = vi.hoisted(() => ({
  oralFluencySession: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { updateBehaviorsService } from "../updateBehaviorsService";

function setupTransaction() {
  mockPrisma.$transaction.mockImplementation(
    (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  );
  mockTx.oralFluencyBehavior.deleteMany.mockResolvedValue({ count: 0 });
  mockTx.oralFluencyBehavior.createMany.mockResolvedValue({ count: 0 });
  mockTx.oralFluencyBehavior.findMany.mockResolvedValue([
    { id: "b-1", behaviorType: "WORD_BY_WORD_READING" },
  ]);
}

describe("updateBehaviorsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when sessionId is empty", async () => {
    const result = await updateBehaviorsService({
      sessionId: "",
      behaviorTypes: [],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.oralFluencySession.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the session does not exist", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);

    const result = await updateBehaviorsService({
      sessionId: "s-1",
      behaviorTypes: [],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("replaces behavior rows for the session", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({ id: "s-1" });
    setupTransaction();

    const result = await updateBehaviorsService({
      sessionId: "s-1",
      behaviorTypes: ["WORD_BY_WORD_READING", "MONOTONOUS_READING"],
    });

    expect(result.success).toBe(true);
    expect(mockTx.oralFluencyBehavior.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: "s-1" },
    });
    expect(mockTx.oralFluencyBehavior.createMany).toHaveBeenCalledWith({
      data: [
        { sessionId: "s-1", behaviorType: "WORD_BY_WORD_READING" },
        { sessionId: "s-1", behaviorType: "MONOTONOUS_READING" },
      ],
    });
  });

  it("does not create rows when all behaviors are cleared", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({ id: "s-1" });
    setupTransaction();

    await updateBehaviorsService({
      sessionId: "s-1",
      behaviorTypes: [],
    });

    expect(mockTx.oralFluencyBehavior.deleteMany).toHaveBeenCalled();
    expect(mockTx.oralFluencyBehavior.createMany).not.toHaveBeenCalled();
  });

  it("deduplicates behavior types before saving", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({ id: "s-1" });
    setupTransaction();

    await updateBehaviorsService({
      sessionId: "s-1",
      behaviorTypes: ["WORD_BY_WORD_READING", "WORD_BY_WORD_READING"],
    });

    expect(mockTx.oralFluencyBehavior.createMany).toHaveBeenCalledWith({
      data: [{ sessionId: "s-1", behaviorType: "WORD_BY_WORD_READING" }],
    });
  });

  it("returns INTERNAL_ERROR when the transaction fails", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue({ id: "s-1" });
    mockPrisma.$transaction.mockRejectedValue(new Error("DB down"));

    const result = await updateBehaviorsService({
      sessionId: "s-1",
      behaviorTypes: ["WORD_BY_WORD_READING"],
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
