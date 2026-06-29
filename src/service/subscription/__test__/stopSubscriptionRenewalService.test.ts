import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXendit = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organizationMember: { findMany: vi.fn() },
  subscription: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXendit }));

import { stopSubscriptionRenewalService } from "../stopSubscriptionRenewalService";

const periodEnd = new Date("2027-01-01T00:00:00Z");

const activeSub = {
  id: "sub-1",
  xenditPlanId: "repl_plan-1",
  status: "ACTIVE",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: periodEnd,
};

/** The service resolves the manageable PERSONAL subscription via findMany. */
function resolveSubscription(subscription: unknown) {
  mockPrisma.organizationMember.findMany.mockResolvedValue([
    { role: "OWNER", organization: { type: "PERSONAL", currentSubscription: subscription } },
  ]);
}

describe("stopSubscriptionRenewalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockXendit.mockResolvedValue({});
  });

  it("returns failure when the user has no personal subscription", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([]);

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: false, error: "No personal subscription to stop" });
    expect(mockXendit).not.toHaveBeenCalled();
  });

  it("is idempotent when renewal is already stopped and returns the period end", async () => {
    resolveSubscription({ ...activeSub, cancelAtPeriodEnd: true });

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: true, alreadyStopped: true, currentPeriodEnd: periodEnd });
    expect(mockXendit).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("skips Xendit when the subscription is not active", async () => {
    resolveSubscription({ ...activeSub, status: "CANCELED" });

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: true, alreadyStopped: true, currentPeriodEnd: periodEnd });
    expect(mockXendit).not.toHaveBeenCalled();
  });

  it("deactivates the Xendit plan, sets cancelAtPeriodEnd, and returns the period end", async () => {
    resolveSubscription(activeSub);

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({
      success: true,
      alreadyStopped: false,
      currentPeriodEnd: periodEnd,
    });
    expect(mockXendit).toHaveBeenCalledWith("/recurring/plans/repl_plan-1/deactivate", "POST");
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { cancelAtPeriodEnd: true },
    });
  });

  it("returns failure when the Xendit call throws", async () => {
    resolveSubscription(activeSub);
    mockXendit.mockRejectedValue(new Error("Xendit down"));

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: false, error: "Failed to stop renewal" });
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("does not call recurring deactivation for payment-session based subscriptions", async () => {
    resolveSubscription({ ...activeSub, xenditPlanId: "ps-123" });

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result.success).toBe(true);
    expect(mockXendit).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { cancelAtPeriodEnd: true },
    });
  });
});
