import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
  oralFluencyMiscue: { delete: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  oralFluencySession: { findUnique: vi.fn(), update: vi.fn() },
};

const mockPrisma = vi.hoisted(() => ({
  oralFluencyMiscue: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { updateMiscueService } from "../updateMiscueService";

const baseMiscue = {
  id: "m-1",
  sessionId: "s-1",
  session: { id: "s-1", totalWords: 10 },
};

function setupTransactionWith(remainingMiscues: { isSelfCorrected: boolean }[], totalWords = 10) {
  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));
  mockTx.oralFluencyMiscue.delete.mockResolvedValue({});
  mockTx.oralFluencyMiscue.update.mockResolvedValue({});
  mockTx.oralFluencyMiscue.findMany.mockResolvedValue(remainingMiscues);
  mockTx.oralFluencySession.findUnique.mockResolvedValue({ totalWords });
  mockTx.oralFluencySession.update.mockResolvedValue({});
}

describe("updateMiscueService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when miscueId is empty", async () => {
    const result = await updateMiscueService({ miscueId: "", action: "approve" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.oralFluencyMiscue.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when action is not approve or update", async () => {
    const result = await updateMiscueService({
      miscueId: "m-1",
      // @ts-expect-error intentional bad action for test
      action: "delete",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when action is update but newMiscueType is missing", async () => {
    const result = await updateMiscueService({ miscueId: "m-1", action: "update" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns NOT_FOUND when miscue does not exist", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(null);

    const result = await updateMiscueService({ miscueId: "nonexistent", action: "approve" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("deletes the miscue when action is approve", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    setupTransactionWith([], 10);

    await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(mockTx.oralFluencyMiscue.delete).toHaveBeenCalledWith({ where: { id: "m-1" } });
    expect(mockTx.oralFluencyMiscue.update).not.toHaveBeenCalled();
  });

  it("updates the miscue type when action is update", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    setupTransactionWith([{ isSelfCorrected: false }], 10);

    await updateMiscueService({ miscueId: "m-1", action: "update", newMiscueType: "OMISSION" });

    expect(mockTx.oralFluencyMiscue.update).toHaveBeenCalledWith({
      where: { id: "m-1" },
      data: { miscueType: "OMISSION" },
    });
    expect(mockTx.oralFluencyMiscue.delete).not.toHaveBeenCalled();
  });

  it("excludes self-corrected miscues from the score recalculation count", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    setupTransactionWith(
      [{ isSelfCorrected: false }, { isSelfCorrected: true }, { isSelfCorrected: false }],
      10,
    );

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.updatedMetrics?.totalMiscues).toBe(2);
  });

  it("recalculates oralFluencyScore as (totalWords - countedMiscues) / totalWords × 100", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    // 10 words, 1 counted miscue → score = (10-1)/10 * 100 = 90.0
    setupTransactionWith([{ isSelfCorrected: false }], 10);

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.updatedMetrics?.oralFluencyScore).toBe(90);
  });

  it("classifies INDEPENDENT when score >= 97", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    setupTransactionWith([], 10); // 0 miscues → 100% score

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.updatedMetrics?.classificationLevel).toBe("INDEPENDENT");
  });

  it("classifies INSTRUCTIONAL when score is between 90 and 97", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    // 10 words, 1 miscue → 90.0
    setupTransactionWith([{ isSelfCorrected: false }], 10);

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.updatedMetrics?.classificationLevel).toBe("INSTRUCTIONAL");
  });

  it("classifies FRUSTRATION when score is below 90", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    // 10 words, 2 miscues → 80.0
    setupTransactionWith([{ isSelfCorrected: false }, { isSelfCorrected: false }], 10);

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.updatedMetrics?.classificationLevel).toBe("FRUSTRATION");
  });

  it("updates the session with recalculated metrics inside the transaction", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    setupTransactionWith([{ isSelfCorrected: false }], 10);

    await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(mockTx.oralFluencySession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalMiscues: 1, oralFluencyScore: 90 }),
      }),
    );
  });

  it("returns INTERNAL_ERROR when the transaction throws", async () => {
    mockPrisma.oralFluencyMiscue.findUnique.mockResolvedValue(baseMiscue);
    mockPrisma.$transaction.mockRejectedValue(new Error("DB down"));

    const result = await updateMiscueService({ miscueId: "m-1", action: "approve" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
