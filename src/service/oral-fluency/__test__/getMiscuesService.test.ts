import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  oralFluencyMiscue: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getOralFluencyMiscues } from "../getMiscuesService";

const baseMiscues = [
  { id: "m-1", sessionId: "s-1", wordIndex: 0, miscueType: "OMISSION", expectedWord: "the", spokenWord: null },
  { id: "m-2", sessionId: "s-1", wordIndex: 3, miscueType: "MISPRONUNCIATION", expectedWord: "cat", spokenWord: "kat" },
];

describe("getOralFluencyMiscues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all miscues for the given session ordered by wordIndex", async () => {
    mockPrisma.oralFluencyMiscue.findMany.mockResolvedValue(baseMiscues);

    const result = await getOralFluencyMiscues("s-1");

    expect(result).toHaveLength(2);
    expect(result[0].miscueType).toBe("OMISSION");
  });

  it("queries by sessionId and orders by wordIndex ascending", async () => {
    mockPrisma.oralFluencyMiscue.findMany.mockResolvedValue([]);

    await getOralFluencyMiscues("s-99");

    expect(mockPrisma.oralFluencyMiscue.findMany).toHaveBeenCalledWith({
      where: { sessionId: "s-99" },
      orderBy: { wordIndex: "asc" },
    });
  });

  it("returns an empty array when the session has no miscues", async () => {
    mockPrisma.oralFluencyMiscue.findMany.mockResolvedValue([]);

    const result = await getOralFluencyMiscues("s-empty");

    expect(result).toHaveLength(0);
  });

  it("propagates prisma errors", async () => {
    mockPrisma.oralFluencyMiscue.findMany.mockRejectedValue(new Error("DB down"));

    await expect(getOralFluencyMiscues("s-1")).rejects.toThrow("DB down");
  });
});
