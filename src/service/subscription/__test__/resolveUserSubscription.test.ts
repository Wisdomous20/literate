import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organizationMember: { findMany: vi.fn() },
  subscription: { updateMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  getDisplayedSubscription,
  getEffectiveActiveSubscription,
} from "../resolveUserSubscription";

const future = new Date("2099-01-01");
const past = new Date("2000-01-01");

function membership(orgType: "PERSONAL" | "TEAM", subscription: unknown, role = "OWNER") {
  return {
    role,
    organization: { type: orgType, currentSubscription: subscription },
  };
}

const activeOrgSub = {
  id: "org-sub-1",
  status: "ACTIVE",
  currentPeriodEnd: future,
  plan: { code: "KASALO" },
  organization: { type: "TEAM" },
};

const activeDirectSub = {
  id: "sub-1",
  status: "ACTIVE",
  currentPeriodEnd: future,
  plan: { code: "SOLO" },
  organization: { type: "PERSONAL" },
};

describe("resolveUserSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
  });

  it("prefers active PERSONAL coverage over an active org seat", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([
      membership("TEAM", activeOrgSub),
      membership("PERSONAL", activeDirectSub),
    ]);

    const result = await getEffectiveActiveSubscription("user-1");

    expect(result?.subscription.id).toBe("sub-1");
    expect(result?.source).toBe("DIRECT");
  });

  it("resolves the org seat when there is no personal coverage", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([
      membership("TEAM", activeOrgSub),
    ]);

    const result = await getEffectiveActiveSubscription("user-1");

    expect(result?.subscription.id).toBe("org-sub-1");
    expect(result?.source).toBe("ORGANIZATION");
    expect(result?.canManage).toBe(true);
  });

  it("returns null when no membership has a current subscription", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([]);

    expect(await getEffectiveActiveSubscription("user-1")).toBeNull();
  });

  it("lazily marks a lapsed ACTIVE row EXPIRED on the displayed-subscription path", async () => {
    const lapsed = {
      id: "sub-lapsed",
      status: "ACTIVE",
      currentPeriodEnd: past,
      plan: { code: "SOLO" },
      organization: { type: "PERSONAL" },
    };
    // No active coverage → effective query returns nothing; displayed fallback hits it.
    mockPrisma.organizationMember.findMany
      .mockResolvedValueOnce([]) // activeOnly = true
      .mockResolvedValueOnce([membership("PERSONAL", lapsed)]); // activeOnly = false

    const result = await getDisplayedSubscription("user-1");

    expect(result?.subscription.id).toBe("sub-lapsed");
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "sub-lapsed" }),
        data: { status: "EXPIRED" },
      }),
    );
  });

  it("does not reconcile a still-valid displayed subscription", async () => {
    mockPrisma.organizationMember.findMany
      .mockResolvedValueOnce([]) // no active coverage via the strict query
      .mockResolvedValueOnce([membership("PERSONAL", activeDirectSub)]);

    await getDisplayedSubscription("user-1");

    expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
  });
});
