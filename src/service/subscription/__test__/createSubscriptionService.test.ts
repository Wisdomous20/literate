import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  subscription: { findUnique: vi.fn(), upsert: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));

import { createSubscriptionService } from "../createSubscriptionService";

const baseInput = {
  userId: "user-1",
  userName: "Juan dela Cruz",
  userEmail: "juan@example.com",
  planType: "SOLO" as const,
};

const xenditCustomer = { id: "cust-abc" };
const xenditPlan = {
  id: "plan-abc",
  status: "ACTIVE",
  actions: [{ action: "AUTH", url: "https://checkout.xendit.co/pay/plan-abc" }],
};

function setupHappyPath(existingCustomerId: string | null = null) {
  mockPrisma.subscription.findUnique.mockResolvedValue(
    existingCustomerId ? { xenditCustomerId: existingCustomerId } : null,
  );
  if (!existingCustomerId) {
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer) // customer creation
      .mockResolvedValueOnce(xenditPlan);     // plan creation
  } else {
    mockXenditRequest.mockResolvedValueOnce(xenditPlan); // plan creation only
  }
  mockPrisma.subscription.upsert.mockResolvedValue({});
}

describe("createSubscriptionService", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Input validation ──────────────────────────────────────────────────────

  it("returns failure for an unknown plan type", async () => {
    const result = await createSubscriptionService({
      ...baseInput,
      // @ts-expect-error intentional bad plan type
      planType: "UNKNOWN",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid plan type");
    expect(mockPrisma.subscription.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when PAMILYA is chosen without memberCount", async () => {
    const result = await createSubscriptionService({ ...baseInput, planType: "PAMILYA" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/20 members/);
  });

  it("returns failure when PAMILYA memberCount is below 20", async () => {
    const result = await createSubscriptionService({ ...baseInput, planType: "PAMILYA", memberCount: 5 });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/20 members/);
  });

  // ── Xendit customer creation ──────────────────────────────────────────────

  it("creates a new Xendit customer when no existing subscription exists", async () => {
    setupHappyPath(null);

    await createSubscriptionService(baseInput);

    const customerCall = mockXenditRequest.mock.calls[0];
    expect(customerCall[0]).toBe("/customers");
    expect(customerCall[2]).toMatchObject({ email: "juan@example.com", reference_id: "user-1" });
  });

  it("skips customer creation when an existing xenditCustomerId is present", async () => {
    setupHappyPath("cust-existing");

    await createSubscriptionService(baseInput);

    // Only one xenditRequest call (plan creation), no customer creation
    expect(mockXenditRequest).toHaveBeenCalledTimes(1);
    const planCall = mockXenditRequest.mock.calls[0];
    expect(planCall[0]).toBe("/recurring/plans");
  });

  // ── Plan creation ─────────────────────────────────────────────────────────

  it("creates a recurring plan with the correct currency and interval", async () => {
    setupHappyPath(null);

    await createSubscriptionService(baseInput);

    const planCall = mockXenditRequest.mock.calls[1];
    expect(planCall[0]).toBe("/recurring/plans");
    expect(planCall[2]).toMatchObject({
      currency: "PHP",
      schedule: expect.objectContaining({ interval: "MONTH", interval_count: 12 }),
    });
  });

  it("uses the calculated price for the SOLO plan (1500)", async () => {
    setupHappyPath(null);

    await createSubscriptionService(baseInput);

    const planCall = mockXenditRequest.mock.calls[1];
    expect(planCall[2].amount).toBe(1500);
  });

  it("uses the calculated price for PAMILYA based on member count (25 × 1000 = 25000)", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer)
      .mockResolvedValueOnce(xenditPlan);
    mockPrisma.subscription.upsert.mockResolvedValue({});

    await createSubscriptionService({ ...baseInput, planType: "PAMILYA", memberCount: 25 });

    const planCall = mockXenditRequest.mock.calls[1];
    expect(planCall[2].amount).toBe(25000);
  });

  // ── Subscription persistence ──────────────────────────────────────────────

  it("upserts the subscription record with PENDING status after creating the plan", async () => {
    setupHappyPath(null);

    await createSubscriptionService(baseInput);

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({ status: "PENDING", planType: "SOLO", xenditPlanId: "plan-abc" }),
        update: expect.objectContaining({ status: "PENDING", xenditPlanId: "plan-abc" }),
      }),
    );
  });

  it("stores the correct maxMembers for the SOLO plan (1)", async () => {
    setupHappyPath(null);

    await createSubscriptionService(baseInput);

    const upsertCall = mockPrisma.subscription.upsert.mock.calls[0][0];
    expect(upsertCall.create.maxMembers).toBe(1);
  });

  it("stores the memberCount as maxMembers for the PAMILYA plan", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer)
      .mockResolvedValueOnce(xenditPlan);
    mockPrisma.subscription.upsert.mockResolvedValue({});

    await createSubscriptionService({ ...baseInput, planType: "PAMILYA", memberCount: 30 });

    const upsertCall = mockPrisma.subscription.upsert.mock.calls[0][0];
    expect(upsertCall.create.maxMembers).toBe(30);
  });

  // ── Action URL handling ───────────────────────────────────────────────────

  it("returns the AUTH action URL on success", async () => {
    setupHappyPath(null);

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(true);
    expect(result.url).toBe("https://checkout.xendit.co/pay/plan-abc");
  });

  it("returns failure when Xendit returns no AUTH action URL", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer)
      .mockResolvedValueOnce({ id: "plan-abc", status: "ACTIVE", actions: [] });
    mockPrisma.subscription.upsert.mockResolvedValue({});

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No action URL/);
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it("returns failure when a Xendit call throws", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockXenditRequest.mockRejectedValue(new Error("Xendit down"));

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create subscription");
  });
});
