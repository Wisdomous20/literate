import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXendit = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXendit }));

import { stopSubscriptionRenewalService } from "../stopSubscriptionRenewalService";

const activeSub = {
  userId: "user-1",
  xenditPlanId: "plan-1",
  status: "ACTIVE",
  cancelAtPeriodEnd: false,
};

describe("stopSubscriptionRenewalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockXendit.mockResolvedValue({});
  });

  it("returns failure when the user has no personal subscription", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: false, error: "No personal subscription to stop" });
    expect(mockXendit).not.toHaveBeenCalled();
  });

  it("is idempotent when renewal is already stopped", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      ...activeSub,
      cancelAtPeriodEnd: true,
    });

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: true, alreadyStopped: true });
    expect(mockXendit).not.toHaveBeenCalled();
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it("skips Xendit when the subscription is not active", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      ...activeSub,
      status: "CANCELED",
    });

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: true, alreadyStopped: true });
    expect(mockXendit).not.toHaveBeenCalled();
  });

  it("deactivates the Xendit plan and sets cancelAtPeriodEnd without touching status", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSub);

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: true, alreadyStopped: false });
    expect(mockXendit).toHaveBeenCalledWith("/recurring/plans/plan-1/deactivate", "POST");
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { cancelAtPeriodEnd: true },
    });
  });

  it("returns failure when the Xendit call throws", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(activeSub);
    mockXendit.mockRejectedValue(new Error("Xendit down"));

    const result = await stopSubscriptionRenewalService("user-1");

    expect(result).toEqual({ success: false, error: "Failed to stop renewal" });
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });
});
