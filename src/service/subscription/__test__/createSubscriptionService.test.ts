import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());
const mockChangePlan = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => {
  const prisma = {
    plan: { upsert: vi.fn() },
    organization: { findUnique: vi.fn(), create: vi.fn() },
    organizationMember: { findFirst: vi.fn(), create: vi.fn() },
    subscription: { findFirst: vi.fn(), create: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((cb) => cb(prisma));
  return prisma;
});

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));
vi.mock("@/service/subscription/changeSubscriptionPlanService", () => ({
  changeSubscriptionPlanService: mockChangePlan,
}));

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

/** No existing org → fresh subscription path, no live plan. */
function setupNewOrgPath(existingCustomerId: string | null = null) {
  mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
  mockPrisma.organization.create.mockResolvedValue({ id: "org-1", type: "PERSONAL" });
  mockPrisma.organizationMember.create.mockResolvedValue({});
  mockPrisma.plan.upsert.mockResolvedValue({ id: "plan-rec-1" });
  // No live subscription on the org.
  mockPrisma.organization.findUnique.mockResolvedValue({ currentSubscription: null });
  mockPrisma.subscription.findFirst.mockResolvedValue(
    existingCustomerId ? { xenditCustomerId: existingCustomerId } : null,
  );
  if (!existingCustomerId) {
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer) // customer creation
      .mockResolvedValueOnce(xenditPlan); // plan creation
  } else {
    mockXenditRequest.mockResolvedValueOnce(xenditPlan); // plan creation only
  }
  mockPrisma.subscription.create.mockResolvedValue({});
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
    if (!result.success) expect(result.error).toBe("Invalid plan type");
    expect(mockPrisma.organizationMember.findFirst).not.toHaveBeenCalled();
  });

  it("returns failure when PAMILYA is chosen without memberCount", async () => {
    const result = await createSubscriptionService({ ...baseInput, planType: "PAMILYA" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/20 members/);
  });

  // ── Tier-change delegation ──────────────────────────────────────────────────

  it("delegates to changeSubscriptionPlanService when the org already has a live plan", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue({ id: "org-1", type: "TEAM" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.plan.upsert.mockResolvedValue({ id: "plan-rec-1" });
    mockPrisma.organization.findUnique.mockResolvedValue({
      currentSubscription: { status: "ACTIVE" },
    });
    mockChangePlan.mockResolvedValue({ success: true, url: "https://change", credit: 1, newCharge: 2 });

    const result = await createSubscriptionService({ ...baseInput, planType: "KASALO" });

    expect(mockChangePlan).toHaveBeenCalledWith("user-1", "KASALO", undefined);
    expect(mockPrisma.subscription.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, url: "https://change" });
  });

  // ── Xendit customer + plan creation ──────────────────────────────────────────

  it("creates a new Xendit customer when no prior subscription exists", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    const customerCall = mockXenditRequest.mock.calls[0];
    expect(customerCall[0]).toBe("/customers");
    expect(customerCall[2]).toMatchObject({ email: "juan@example.com", reference_id: "user-1" });
  });

  it("reuses an existing Xendit customer from a prior subscription", async () => {
    setupNewOrgPath("cust-existing");

    await createSubscriptionService(baseInput);

    expect(mockXenditRequest).toHaveBeenCalledTimes(1);
    expect(mockXenditRequest.mock.calls[0][0]).toBe("/recurring/plans");
  });

  it("uses the calculated price for the SOLO plan (1500)", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    const planCall = mockXenditRequest.mock.calls[1];
    expect(planCall[2].amount).toBe(1500);
  });

  // ── Subscription persistence ──────────────────────────────────────────────

  it("creates a fresh PENDING subscription row (never upserts in place)", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    expect(mockPrisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          organizationId: "org-1",
          xenditPlanId: "plan-abc",
          maxMembersSnapshot: 1,
          priceAmountSnapshot: 1500,
        }),
      }),
    );
  });

  // ── Action URL handling ───────────────────────────────────────────────────

  it("returns the AUTH action URL on success", async () => {
    setupNewOrgPath(null);

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(true);
    if (result.success) expect(result.url).toBe("https://checkout.xendit.co/pay/plan-abc");
  });

  it("returns failure when Xendit returns no AUTH action URL", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue({ id: "org-1", type: "PERSONAL" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.plan.upsert.mockResolvedValue({ id: "plan-rec-1" });
    mockPrisma.organization.findUnique.mockResolvedValue({ currentSubscription: null });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockXenditRequest
      .mockResolvedValueOnce(xenditCustomer)
      .mockResolvedValueOnce({ id: "plan-abc", status: "ACTIVE", actions: [] });
    mockPrisma.subscription.create.mockResolvedValue({});

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/No action URL/);
  });

  it("returns failure when a Xendit call throws", async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue({ id: "org-1", type: "PERSONAL" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.plan.upsert.mockResolvedValue({ id: "plan-rec-1" });
    mockPrisma.organization.findUnique.mockResolvedValue({ currentSubscription: null });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockXenditRequest.mockRejectedValue(new Error("Xendit down"));

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Failed to create subscription");
  });
});
