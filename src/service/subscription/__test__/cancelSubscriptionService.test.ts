import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organizationMember: { findMany: vi.fn() },
  subscription: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));

import { cancelSubscriptionService } from "../cancelSubscriptionService";

const activeSubscription = {
  id: "sub-1",
  status: "ACTIVE",
  xenditPlanId: "repl_plan-abc",
};

/** The service resolves the manageable PERSONAL subscription via findMany. */
function resolveSubscription(subscription: unknown) {
  mockPrisma.organizationMember.findMany.mockResolvedValue([
    { role: "OWNER", organization: { type: "PERSONAL", currentSubscription: subscription } },
  ]);
}

describe("cancelSubscriptionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when no subscription exists for the user", async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([]);

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No active subscription");
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("returns failure when the subscription has no xenditPlanId", async () => {
    resolveSubscription({ ...activeSubscription, xenditPlanId: null });

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No active subscription");
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("calls the Xendit deactivate endpoint with the plan id", async () => {
    resolveSubscription(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    await cancelSubscriptionService("user-1");

    expect(mockXenditRequest).toHaveBeenCalledWith(
      "/recurring/plans/repl_plan-abc/deactivate",
      "POST",
    );
  });

  it("marks the subscription as CANCELED after a successful Xendit call", async () => {
    resolveSubscription(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    await cancelSubscriptionService("user-1");

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { status: "CANCELED" },
    });
  });

  it("returns success after cancellation", async () => {
    resolveSubscription(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(true);
  });

  it("returns failure when the Xendit call throws", async () => {
    resolveSubscription(activeSubscription);
    mockXenditRequest.mockRejectedValue(new Error("Xendit error"));

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to cancel subscription");
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("does not call recurring deactivation for payment-session based subscriptions", async () => {
    resolveSubscription({ ...activeSubscription, xenditPlanId: "ps-abc" });
    mockPrisma.subscription.update.mockResolvedValue({});

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(true);
    expect(mockXenditRequest).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { status: "CANCELED" },
    });
  });
});
