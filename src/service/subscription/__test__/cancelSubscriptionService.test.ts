import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));

import { cancelSubscriptionService } from "../cancelSubscriptionService";

const activeSubscription = {
  id: "sub-1",
  userId: "user-1",
  planType: "SOLO",
  status: "ACTIVE",
  xenditPlanId: "plan-abc",
};

describe("cancelSubscriptionService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when no subscription exists for the user", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No active subscription");
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("returns failure when the subscription has no xenditPlanId", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({ ...activeSubscription, xenditPlanId: null });

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No active subscription");
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("calls the Xendit deactivate endpoint with the plan id", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    await cancelSubscriptionService("user-1");

    expect(mockXenditRequest).toHaveBeenCalledWith(
      "/recurring/plans/plan-abc/deactivate",
      "POST",
    );
  });

  it("marks the subscription as CANCELED after a successful Xendit call", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    await cancelSubscriptionService("user-1");

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { status: "CANCELED" },
    });
  });

  it("returns success after cancellation", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);
    mockXenditRequest.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({});

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(true);
  });

  it("returns failure when the Xendit call throws", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSubscription);
    mockXenditRequest.mockRejectedValue(new Error("Xendit error"));

    const result = await cancelSubscriptionService("user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to cancel subscription");
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });
});
