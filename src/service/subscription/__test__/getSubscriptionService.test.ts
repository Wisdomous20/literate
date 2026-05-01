import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  subscription: { findFirst: vi.fn(), findUnique: vi.fn() },
  organizationMember: { findFirst: vi.fn() },
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

  it("returns the org subscription when org coverage exists for the user", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: {
        subscription: {
          id: "org-sub-1",
          userId: "owner-1",
          organizationId: "org-1",
          planType: "KASALO",
          status: "ACTIVE",
          maxMembers: 10,
          currentPeriodEnd: new Date("2099-01-01"),
          cancelAtPeriodEnd: false,
        },
      },
    });

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({ id: "org-sub-1", planType: "KASALO" });
    expect(result.source).toBe("ORGANIZATION");
    expect(result.canManage).toBe(false);
  });

  it("falls back to the user's direct subscription when org coverage does not exist", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(baseSubscription);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({ id: "sub-1", planType: "SOLO" });
    expect(result.source).toBe("DIRECT");
    expect(result.canManage).toBe(true);
  });

  it("returns a non-active direct subscription when there is no active effective subscription", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      ...baseSubscription,
      status: "CANCELED",
      currentPeriodEnd: new Date("2024-01-01"),
    });

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({ id: "sub-1", status: "CANCELED" });
    expect(result.source).toBe("DIRECT");
    expect(result.canManage).toBe(true);
  });

  it("returns null subscription when none exists for the user", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toBeNull();
    expect(result.source).toBeNull();
    expect(result.canManage).toBe(false);
  });

  it("checks active org coverage before falling back to direct display", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    await getSubscriptionService("user-99");

    expect(mockPrisma.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-99" }),
      }),
    );
    expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-99" },
    });
  });
});
