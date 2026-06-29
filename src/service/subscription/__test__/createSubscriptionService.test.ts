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
const xenditSession = {
  payment_session_id: "ps-abc",
  payment_link_url: "https://checkout.xendit.co/pay/plan-abc",
  customer_id: "cust-abc",
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
  mockXenditRequest.mockResolvedValueOnce({
    ...xenditSession,
    customer_id: existingCustomerId ?? xenditCustomer.id,
  });
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

  it("creates a hosted session with unique inline customer data when no prior customer exists", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    const sessionCall = mockXenditRequest.mock.calls[0];
    expect(sessionCall[0]).toBe("/sessions");
    expect(sessionCall[2]).toMatchObject({
      customer: {
        email: "juan@example.com",
      },
      metadata: {
        userId: "user-1",
      },
    });
    expect(sessionCall[2].customer.reference_id).toMatch(/^lit-customer-user-1-[a-f0-9]+$/);
    expect(sessionCall[2].customer.reference_id.length).toBeLessThanOrEqual(64);
    expect(sessionCall[2].customer.reference_id).not.toBe("user-1");
  });

  it("does not reuse the same inline customer reference after an abandoned checkout", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: { id: "org-1", type: "PERSONAL" },
    });
    mockPrisma.organization.findUnique.mockResolvedValue({ currentSubscription: null });
    mockPrisma.subscription.findFirst.mockResolvedValue({
      xenditCustomerId: null,
    });
    mockXenditRequest.mockResolvedValueOnce(xenditSession);
    mockPrisma.subscription.create.mockResolvedValue({});

    await createSubscriptionService(baseInput);

    const firstCustomerReference =
      mockXenditRequest.mock.calls[0][2].customer.reference_id;
    const secondCustomerReference =
      mockXenditRequest.mock.calls[1][2].customer.reference_id;

    expect(secondCustomerReference).toMatch(/^lit-customer-user-1-[a-f0-9]+$/);
    expect(secondCustomerReference).not.toBe(firstCustomerReference);
  });

  it("reuses an existing Xendit customer from a prior subscription", async () => {
    setupNewOrgPath("cust-existing");

    await createSubscriptionService(baseInput);

    expect(mockXenditRequest).toHaveBeenCalledTimes(1);
    expect(mockXenditRequest.mock.calls[0][0]).toBe("/sessions");
    expect(mockXenditRequest.mock.calls[0][2]).toMatchObject({
      customer_id: "cust-existing",
    });
  });

  it("uses the calculated price for the SOLO plan (1500)", async () => {
    setupNewOrgPath(null);

    await createSubscriptionService(baseInput);

    const planCall = mockXenditRequest.mock.calls[0];
    expect(planCall[2].amount).toBe(1500);
    expect(planCall[2].session_type).toBe("PAY");
    expect(planCall[2].allow_save_payment_method).toBe("FORCED");
    expect(planCall[2].reference_id.length).toBeLessThanOrEqual(64);
    expect(planCall[2].payment_method_configuration.reference_id.length).toBeLessThanOrEqual(64);
    expect(planCall[2].channel_properties.cards).toMatchObject({
      card_on_file_type: "RECURRING",
      recurring_configuration: {
        recurring_frequency: 365,
      },
    });
    expect(
      planCall[2].channel_properties.cards.recurring_configuration.recurring_expiry,
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
          xenditPlanId: "ps-abc",
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
    mockXenditRequest.mockResolvedValueOnce({ payment_session_id: "ps-abc" });
    mockPrisma.subscription.create.mockResolvedValue({});

    const result = await createSubscriptionService(baseInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Failed to create subscription: Xendit did not return a payment link",
      );
    }
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
    if (!result.success) expect(result.error).toBe("Failed to create subscription: Xendit down");
  });
});
