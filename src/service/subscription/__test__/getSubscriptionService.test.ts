import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  subscription: { updateMany: vi.fn() },
  organizationMember: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getSubscriptionService } from "../getSubscriptionService";

const futureDate = new Date("2099-01-01");
const pastDate = new Date("2024-01-01");

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    organizationId: "org-1",
    status: "ACTIVE",
    maxMembersSnapshot: 1,
    priceAmountSnapshot: 1500,
    currencySnapshot: "PHP",
    xenditPlanId: "plan-abc",
    xenditCustomerId: "cust-abc",
    currentPeriodEnd: futureDate,
    plan: {
      id: "plan-1",
      code: "SOLO",
      priceAmount: 1500,
    },
    organization: {
      id: "org-1",
      type: "PERSONAL",
    },
    ...overrides,
  };
}

function membership(
  orgType: "PERSONAL" | "TEAM",
  sub: ReturnType<typeof subscription> | null,
  role = "OWNER",
) {
  return {
    role,
    organization: {
      id: orgType === "PERSONAL" ? "personal-org" : "team-org",
      type: orgType,
      currentSubscription: sub
        ? {
            ...sub,
            organization: {
              id: orgType === "PERSONAL" ? "personal-org" : "team-org",
              type: orgType,
            },
          }
        : null,
    },
  };
}

describe("getSubscriptionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns organization subscription coverage for team members", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValueOnce([
      membership("TEAM", subscription({ id: "org-sub-1", maxMembersSnapshot: 10 }), "USER"),
    ]);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({
      id: "org-sub-1",
      planType: "SOLO",
      maxMembers: 10,
    });
    expect(result.source).toBe("ORGANIZATION");
    expect(result.canManage).toBe(false);
  });

  it("prefers the user's personal subscription when personal and team coverage both exist", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValueOnce([
      membership("TEAM", subscription({ id: "team-sub" }), "USER"),
      membership("PERSONAL", subscription({ id: "personal-sub" }), "OWNER"),
    ]);

    const result = await getSubscriptionService("user-1");

    expect(result.subscription).toMatchObject({ id: "personal-sub" });
    expect(result.source).toBe("DIRECT");
    expect(result.canManage).toBe(true);
  });

  it("returns a non-active displayed subscription when no active effective subscription exists", async () => {
    mockPrisma.organizationMember.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        membership(
          "PERSONAL",
          subscription({
            status: "CANCELED",
            currentPeriodEnd: pastDate,
          }),
        ),
      ]);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toMatchObject({ id: "sub-1", status: "CANCELED" });
    expect(result.source).toBe("DIRECT");
    expect(result.canManage).toBe(true);
  });

  it("returns null subscription when no membership has a current subscription", async () => {
    mockPrisma.organizationMember.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(result.subscription).toBeNull();
    expect(result.source).toBeNull();
    expect(result.canManage).toBe(false);
  });

  it("checks active membership coverage before displayed inactive coverage", async () => {
    mockPrisma.organizationMember.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await getSubscriptionService("user-99");

    expect(mockPrisma.organizationMember.findMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.organizationMember.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        userId: "user-99",
        organization: {
          currentSubscription: {
            is: {
              status: "ACTIVE",
            },
          },
        },
      },
    });
  });
});
