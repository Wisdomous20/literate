import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  classRoom: { findMany: vi.fn() },
  assessment: { groupBy: vi.fn() },
}));

const mockHasActiveSubscription = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/utils/subscriptionCheck", () => ({
  hasActiveSubscription: mockHasActiveSubscription,
}));

import {
  getDailyUsage,
  checkDailyLimit,
  getDailyLimitStatus,
  FREE_TIER_DAILY_LIMITS,
} from "../checkDailyLimitService";

// ─── getDailyUsage ───────────────────────────────────────────────────────────

describe("getDailyUsage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns zero counts when user has no classrooms", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([]);

    const usage = await getDailyUsage("user-1");

    expect(usage).toEqual({ ORAL_READING: 0, COMPREHENSION: 0, READING_FLUENCY: 0 });
    expect(mockPrisma.assessment.groupBy).not.toHaveBeenCalled();
  });

  it("returns zero counts when no assessments were taken today", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([]);

    const usage = await getDailyUsage("user-1");

    expect(usage).toEqual({ ORAL_READING: 0, COMPREHENSION: 0, READING_FLUENCY: 0 });
  });

  it("returns correct counts from groupBy results", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "ORAL_READING", _count: { id: 2 } },
      { type: "COMPREHENSION", _count: { id: 1 } },
    ]);

    const usage = await getDailyUsage("user-1");

    expect(usage).toEqual({ ORAL_READING: 2, COMPREHENSION: 1, READING_FLUENCY: 0 });
  });

  it("aggregates counts across multiple classrooms", async () => {
    mockPrisma.classRoom.findMany.mockResolvedValue([
      { id: "class-1" },
      { id: "class-2" },
    ]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "READING_FLUENCY", _count: { id: 3 } },
    ]);

    const usage = await getDailyUsage("user-1");

    expect(usage.READING_FLUENCY).toBe(3);
    const callArgs = mockPrisma.assessment.groupBy.mock.calls[0][0];
    expect(callArgs.where.student.classRoomId.in).toEqual(["class-1", "class-2"]);
  });
});

// ─── checkDailyLimit ─────────────────────────────────────────────────────────

describe("checkDailyLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always allows paid users regardless of usage", async () => {
    mockHasActiveSubscription.mockResolvedValue(true);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "COMPREHENSION", _count: { id: 99 } },
    ]);

    const result = await checkDailyLimit("user-1", "COMPREHENSION");

    expect(result.allowed).toBe(true);
    expect(result.isFreeUser).toBe(false);
    expect(result.limits.COMPREHENSION).toBe(Infinity);
  });

  it("allows free users who have not yet hit the daily limit", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([]);

    const result = await checkDailyLimit("user-1", "COMPREHENSION");

    expect(result.allowed).toBe(true);
    expect(result.isFreeUser).toBe(true);
  });

  it("blocks free users who have reached the daily limit", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "COMPREHENSION", _count: { id: FREE_TIER_DAILY_LIMITS.COMPREHENSION } },
    ]);

    const result = await checkDailyLimit("user-1", "COMPREHENSION");

    expect(result.allowed).toBe(false);
    expect(result.isFreeUser).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it("includes the assessment type in the reason message when blocked", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "ORAL_READING", _count: { id: FREE_TIER_DAILY_LIMITS.ORAL_READING } },
    ]);

    const result = await checkDailyLimit("user-1", "ORAL_READING");

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/oral reading/i);
  });

  it("enforces limits independently per assessment type", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "ORAL_READING", _count: { id: FREE_TIER_DAILY_LIMITS.ORAL_READING } },
    ]);

    const blocked = await checkDailyLimit("user-1", "ORAL_READING");
    const allowed = await checkDailyLimit("user-1", "COMPREHENSION");

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });
});

// ─── getDailyLimitStatus ──────────────────────────────────────────────────────

describe("getDailyLimitStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns infinite limits and isFreeUser false for paid users", async () => {
    mockHasActiveSubscription.mockResolvedValue(true);
    mockPrisma.classRoom.findMany.mockResolvedValue([]);

    const status = await getDailyLimitStatus("user-1");

    expect(status.isFreeUser).toBe(false);
    expect(status.limits.ORAL_READING).toBe(Infinity);
    expect(status.remaining.COMPREHENSION).toBe(Infinity);
    expect(status.remaining.READING_FLUENCY).toBe(Infinity);
  });

  it("returns correct remaining counts for free users", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "ORAL_READING", _count: { id: 1 } },
    ]);

    const status = await getDailyLimitStatus("user-1");

    expect(status.isFreeUser).toBe(true);
    expect(status.remaining.ORAL_READING).toBe(0);
    expect(status.remaining.COMPREHENSION).toBe(FREE_TIER_DAILY_LIMITS.COMPREHENSION);
    expect(status.remaining.READING_FLUENCY).toBe(FREE_TIER_DAILY_LIMITS.READING_FLUENCY);
  });

  it("never returns negative remaining counts when usage exceeds limits", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "READING_FLUENCY", _count: { id: 5 } },
    ]);

    const status = await getDailyLimitStatus("user-1");

    expect(status.remaining.READING_FLUENCY).toBe(0);
  });

  it("returns zero remaining for all types when all limits are used up", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.classRoom.findMany.mockResolvedValue([{ id: "class-1" }]);
    mockPrisma.assessment.groupBy.mockResolvedValue([
      { type: "ORAL_READING", _count: { id: FREE_TIER_DAILY_LIMITS.ORAL_READING } },
      { type: "COMPREHENSION", _count: { id: FREE_TIER_DAILY_LIMITS.COMPREHENSION } },
      { type: "READING_FLUENCY", _count: { id: FREE_TIER_DAILY_LIMITS.READING_FLUENCY } },
    ]);

    const status = await getDailyLimitStatus("user-1");

    expect(status.remaining.ORAL_READING).toBe(0);
    expect(status.remaining.COMPREHENSION).toBe(0);
    expect(status.remaining.READING_FLUENCY).toBe(0);
  });
});
