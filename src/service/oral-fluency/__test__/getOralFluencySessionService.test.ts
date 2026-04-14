import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  oralFluencySession: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getOralFluencySessionService } from "../getOralFluencySessionService";

const baseSession = {
  id: "s-1",
  assessmentId: "a-1",
  audioUrl: "http://example.com/audio.wav",
  status: "COMPLETED",
  miscues: [],
  behaviors: [],
  wordTimestamps: [],
  assessment: { id: "a-1", type: "READING_FLUENCY" },
};

describe("getOralFluencySessionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when sessionId is empty", async () => {
    const result = await getOralFluencySessionService("");

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.oralFluencySession.findUnique).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when no session matches the id", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(null);

    const result = await getOralFluencySessionService("nonexistent");

    expect(result.success).toBe(false);
    expect(result.code).toBe("NOT_FOUND");
  });

  it("returns the session with all related data on success", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(baseSession);

    const result = await getOralFluencySessionService("s-1");

    expect(result.success).toBe(true);
    expect(result.session).toMatchObject({ id: "s-1" });
  });

  it("includes miscues, behaviors, wordTimestamps, and assessment in the query", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(baseSession);

    await getOralFluencySessionService("s-1");

    const query = mockPrisma.oralFluencySession.findUnique.mock.calls[0][0];
    expect(query.include).toMatchObject({
      miscues: expect.any(Object),
      behaviors: true,
      wordTimestamps: expect.any(Object),
      assessment: true,
    });
  });

  it("orders miscues by wordIndex ascending in the query", async () => {
    mockPrisma.oralFluencySession.findUnique.mockResolvedValue(baseSession);

    await getOralFluencySessionService("s-1");

    const query = mockPrisma.oralFluencySession.findUnique.mock.calls[0][0];
    expect(query.include.miscues.orderBy).toEqual({ wordIndex: "asc" });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.oralFluencySession.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await getOralFluencySessionService("s-1");

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});
