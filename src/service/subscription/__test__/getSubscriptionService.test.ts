import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getSubscriptionService } from "../getSubscriptionService";

const baseSubscription = {
  id: "sub-1",
  userId: "user-1",
  planType: "SOLO",
  status: "ACTIVE",
  maxMembers: 1,
  xenditPlanId: "plan-abc",
  xenditCustomerId: "cust-abc",
};

describe("getSubscriptionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the subscription when one exists for the user", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(baseSubscription);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({ id: "sub-1", planType: "SOLO" });
  });

  it("returns null subscription when none exists for the user", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toBeNull();
  });

  it("queries by userId", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    await getSubscriptionService("user-99");

    expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-99" },
    });
  });
});
