import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  subscription: { findFirst: vi.fn(), findUnique: vi.fn() },
  organizationMember: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  getDisplayedSubscription,
  getEffectiveActiveSubscription,
} from "../resolveUserSubscription";

const activeDirectSubscription = {
  id: "sub-1",
  userId: "user-1",
  organizationId: null,
  planType: "SOLO",
  status: "ACTIVE",
  maxMembers: 1,
  xenditPlanId: "plan-abc",
  xenditCustomerId: "cust-abc",
  currentPeriodEnd: new Date("2099-01-01"),
  currentPeriodStart: new Date("2098-01-01"),
  cancelAtPeriodEnd: false,
  createdAt: new Date("2098-01-01"),
  updatedAt: new Date("2098-01-01"),
};

const activeOrgSubscription = {
  id: "org-sub-1",
  userId: "owner-1",
  organizationId: "org-1",
  planType: "KASALO",
  status: "ACTIVE",
  maxMembers: 10,
  xenditPlanId: "org-plan-abc",
  xenditCustomerId: "org-cust-abc",
  currentPeriodEnd: new Date("2099-01-01"),
  currentPeriodStart: new Date("2098-01-01"),
  cancelAtPeriodEnd: false,
  createdAt: new Date("2098-01-01"),
  updatedAt: new Date("2098-01-01"),
};

describe("resolveUserSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prefers active org coverage over an active direct subscription", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: {
        subscription: activeOrgSubscription,
      },
    });

    const result = await getEffectiveActiveSubscription("user-1");

    expect(result?.subscription).toEqual(activeOrgSubscription);
    expect(result?.source).toBe("ORGANIZATION");
    expect(result?.canManage).toBe(false);
    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to an active direct subscription when no active org seat exists", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(activeDirectSubscription);

    const result = await getEffectiveActiveSubscription("user-1");

    expect(result?.subscription).toEqual(activeDirectSubscription);
    expect(result?.source).toBe("DIRECT");
    expect(result?.canManage).toBe(true);
  });

  it("treats an org owner as able to manage the org subscription", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: {
        subscription: {
          ...activeOrgSubscription,
          userId: "user-1",
        },
      },
    });

    const result = await getEffectiveActiveSubscription("user-1");

    expect(result?.source).toBe("ORGANIZATION");
    expect(result?.canManage).toBe(true);
  });

  it("returns the direct subscription for display when no active entitlement exists", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findUnique.mockResolvedValue({
      ...activeDirectSubscription,
      status: "CANCELED",
      currentPeriodEnd: new Date("2024-01-01"),
    });

    const result = await getDisplayedSubscription("user-1");

    expect(result?.subscription).toMatchObject({ id: "sub-1", status: "CANCELED" });
    expect(result?.source).toBe("DIRECT");
    expect(result?.canManage).toBe(true);
  });

  it("returns null when the user has neither org nor direct subscription data", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const result = await getDisplayedSubscription("user-1");

    expect(result).toBeNull();
  });
});
