import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  organizationMember: { findFirst: vi.fn() },
  plan: { upsert: vi.fn() },
  subscription: { create: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));

import { changeSubscriptionPlanService } from "../changeSubscriptionPlanService";

const DAY = 24 * 60 * 60 * 1000;

const xenditPlan = {
  id: "plan-new",
  actions: [{ action: "AUTH", url: "https://checkout.xendit.co/pay/plan-new" }],
};

/** Active subscription on a TEAM org with ~half the period remaining. */
function activeTeamSubscription(priceAmountSnapshot: number) {
  const now = Date.now();
  return {
    id: "sub-old",
    organizationId: "org-1",
    status: "ACTIVE",
    priceAmountSnapshot,
    currencySnapshot: "PHP",
    xenditCustomerId: "cust-1",
    xenditPlanId: "plan-old",
    currentPeriodStart: new Date(now - 10 * DAY),
    currentPeriodEnd: new Date(now + 10 * DAY),
  };
}

function setupCurrentSubscription(priceAmountSnapshot: number) {
  mockPrisma.organizationMember.findFirst.mockResolvedValue({
    role: "OWNER",
    organization: {
      id: "org-1",
      type: "TEAM",
      currentSubscription: activeTeamSubscription(priceAmountSnapshot),
    },
  });
  mockPrisma.plan.upsert.mockResolvedValue({ id: "plan-rec-panalo" });
  mockXenditRequest.mockResolvedValue(xenditPlan);
  mockPrisma.subscription.create.mockResolvedValue({ id: "sub-new" });
}

describe("changeSubscriptionPlanService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when the user has no active subscription", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);

    const result = await changeSubscriptionPlanService("user-1", "PANALO");

    expect(result.success).toBe(false);
    expect(mockPrisma.subscription.create).not.toHaveBeenCalled();
  });

  it("creates a new PENDING row at full price without touching the live row", async () => {
    setupCurrentSubscription(5000); // current KASALO

    const result = await changeSubscriptionPlanService("user-1", "PANALO");

    expect(result.success).toBe(true);
    // Live row is never mutated by the change service (the webhook does the swap).
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();

    const createArg = mockPrisma.subscription.create.mock.calls[0][0];
    expect(createArg.data).toMatchObject({
      organizationId: "org-1",
      status: "PENDING",
      priceAmountSnapshot: 15000, // full PANALO price snapshot
      xenditPlanId: "plan-new",
    });
  });

  it("bills the recurring plan at full price (discount never leaks into renewals)", async () => {
    setupCurrentSubscription(5000);

    await changeSubscriptionPlanService("user-1", "PANALO");

    const planCall = mockXenditRequest.mock.calls.find(
      (c) => c[0] === "/recurring/plans",
    );
    expect(planCall?.[2].amount).toBe(15000);
    // Anchors renewals to the current period boundary and tags the swap metadata.
    expect(planCall?.[2].metadata).toMatchObject({
      planChange: "true",
      previousXenditPlanId: "plan-old",
    });
  });

  it("computes newCharge = full − credit (consistency), credit ~half the old price", async () => {
    setupCurrentSubscription(5000); // ~half remaining → credit ~2500

    const result = await changeSubscriptionPlanService("user-1", "PANALO");

    if (!result.success) throw new Error("expected success");
    expect(result.credit).toBeGreaterThan(2300);
    expect(result.credit).toBeLessThan(2700);
    expect(result.newCharge).toBeCloseTo(15000 - result.credit, 2);
  });

  it("floors newCharge at 0 when the credit exceeds the new full price (downgrade)", async () => {
    setupCurrentSubscription(15000); // current PANALO, ~half remaining → credit ~7500

    const result = await changeSubscriptionPlanService("user-1", "KASALO"); // full 5000

    if (!result.success) throw new Error("expected success");
    expect(result.credit).toBeGreaterThan(5000);
    expect(result.newCharge).toBe(0);
    // Recurring still bills full KASALO price.
    const planCall = mockXenditRequest.mock.calls.find(
      (c) => c[0] === "/recurring/plans",
    );
    expect(planCall?.[2].amount).toBe(5000);
  });
});
