import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  class: { count: vi.fn() },
  student: { count: vi.fn() },
}));
const mockHasActiveSubscription = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/utils/subscriptionCheck", () => ({
  hasActiveSubscription: mockHasActiveSubscription,
}));

import {
  getResourceLimitStatus,
  FREE_TIER_LIMITS,
} from "../checkDailyLimitService";

describe("getResourceLimitStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports free-tier caps for an unsubscribed user", async () => {
    mockHasActiveSubscription.mockResolvedValue(false);
    mockPrisma.class.count.mockResolvedValue(1);
    mockPrisma.student.count.mockResolvedValue(0);

    const status = await getResourceLimitStatus("user-1");

    expect(status).toEqual({
      isFreeUser: true,
      classes: { count: 1, max: FREE_TIER_LIMITS.MAX_CLASSES },
      students: { count: 0, max: FREE_TIER_LIMITS.MAX_STUDENTS },
    });
    // Only non-archived classes count toward the cap.
    expect(mockPrisma.class.count).toHaveBeenCalledWith({
      where: { userId: "user-1", archived: false },
    });
  });

  it("reports unlimited (Infinity) caps for a paid user", async () => {
    mockHasActiveSubscription.mockResolvedValue(true);
    mockPrisma.class.count.mockResolvedValue(12);
    mockPrisma.student.count.mockResolvedValue(340);

    const status = await getResourceLimitStatus("user-1");

    expect(status.isFreeUser).toBe(false);
    expect(status.classes.max).toBe(Infinity);
    expect(status.students.max).toBe(Infinity);
    expect(status.classes.count).toBe(12);
    expect(status.students.count).toBe(340);
  });
});
