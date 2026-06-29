import { beforeEach, describe, expect, it, vi } from "vitest";

const mockXenditRequest = vi.hoisted(() => vi.fn());
const mockCreateInvoice = vi.hoisted(() => vi.fn());
const mockClaim = vi.hoisted(() => vi.fn());
const mockComplete = vi.hoisted(() => vi.fn());
const mockRelease = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => {
  const prisma = {
    subscription: { findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    organization: { update: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((cb) => cb(prisma));
  return prisma;
});

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/xendit", () => ({ xenditRequest: mockXenditRequest }));
vi.mock("@/service/subscription/invoiceService", () => ({
  createInvoiceAndSendEmail: mockCreateInvoice,
}));
vi.mock("@/service/subscription/xenditWebhookDeliveryService", () => ({
  claimXenditWebhookDelivery: mockClaim,
  completeXenditWebhookDelivery: mockComplete,
  releaseXenditWebhookDelivery: mockRelease,
}));
vi.mock("@/lib/xenditWebhookSecurity", () => ({
  verifyXenditWebhookToken: () => true,
  createXenditWebhookDeliveryId: () => "delivery-1",
}));

import { POST } from "../route";

function request(body: unknown) {
  const raw = JSON.stringify(body);
  return {
    headers: { get: () => "token" },
    text: async () => raw,
  } as unknown as Parameters<typeof POST>[0];
}

const planChangeActivated = {
  event: "recurring.plan.activated",
  data: {
    id: "plan-new",
    metadata: {
      maxMembers: "15",
      planChange: "true",
      previousXenditPlanId: "plan-old",
      subtotalAmount: "15000",
      discountAmount: "2500",
      totalAmount: "12500",
    },
  },
};

describe("xendit webhook — plan change swap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClaim.mockResolvedValue("claimed");
    mockXenditRequest.mockResolvedValue({});
    mockCreateInvoice.mockResolvedValue({});
    mockPrisma.subscription.findFirst.mockResolvedValue({ id: "sub-new" });
    mockPrisma.subscription.update.mockResolvedValue({ id: "sub-new", organizationId: "org-1" });
    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.organization.update.mockResolvedValue({});
  });

  it("supersedes the old row, deactivates the old plan, and repoints the org", async () => {
    const res = await POST(request(planChangeActivated));
    expect(res.status).toBe(200);

    // New row → ACTIVE.
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-new" },
        data: expect.objectContaining({ status: "ACTIVE", maxMembersSnapshot: 15 }),
      }),
    );
    // Old row → SUPERSEDED.
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ xenditPlanId: "plan-old" }),
        data: { status: "SUPERSEDED" },
      }),
    );
    // Org pointer repointed to the new row.
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { currentSubscriptionId: "sub-new" },
    });
    // Old Xendit plan deactivated exactly once.
    expect(mockXenditRequest).toHaveBeenCalledWith(
      "/recurring/plans/plan-old/deactivate",
      "POST",
    );
  });

  it("creates the invoice with the proration discount line", async () => {
    await POST(request(planChangeActivated));

    expect(mockCreateInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: "sub-new",
        subtotalAmount: 15000,
        discountAmount: 2500,
        totalAmount: 12500,
      }),
    );
  });

  it("is idempotent: a duplicate delivery does nothing", async () => {
    mockClaim.mockResolvedValue("duplicate");

    const res = await POST(request(planChangeActivated));
    const json = await res.json();

    expect(json).toMatchObject({ duplicate: true });
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("does not deactivate or supersede for a first-time (non-change) activation", async () => {
    await POST(
      request({
        event: "recurring.plan.activated",
        data: { id: "plan-new", metadata: { maxMembers: "1" } },
      }),
    );

    // Still sets the org pointer for the new org's first subscription.
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { currentSubscriptionId: "sub-new" },
    });
    expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
    expect(mockXenditRequest).not.toHaveBeenCalled();
  });

  it("activates a subscription after a successful payment session", async () => {
    await POST(
      request({
        event: "payment_session.completed",
        data: {
          payment_session_id: "ps-new",
          metadata: { maxMembers: "10" },
        },
      }),
    );

    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-new" },
        data: expect.objectContaining({
          status: "ACTIVE",
          xenditPlanId: "ps-new",
          maxMembersSnapshot: 10,
        }),
      }),
    );
    expect(mockPrisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { currentSubscriptionId: "sub-new" },
    });
    expect(mockCreateInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: "sub-new",
        providerInvoiceId: expect.stringContaining("payment_session.completed"),
      }),
    );
  });

  it("falls back to metadata when the webhook payment id differs from the stored checkout reference", async () => {
    mockPrisma.subscription.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "sub-fallback" });
    mockPrisma.subscription.update.mockResolvedValue({
      id: "sub-fallback",
      organizationId: "org-1",
    });

    await POST(
      request({
        event: "payment_session.completed",
        data: {
          id: "ps-provider-id",
          metadata: {
            checkoutReferenceId: "lit-sub-local",
            organizationId: "org-1",
            planId: "plan-rec-1",
            maxMembers: "10",
          },
        },
      }),
    );

    expect(mockPrisma.subscription.findFirst).toHaveBeenNthCalledWith(1, {
      where: { xenditPlanId: "ps-provider-id", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    expect(mockPrisma.subscription.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        organizationId: "org-1",
        planId: "plan-rec-1",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-fallback" },
        data: expect.objectContaining({ xenditPlanId: "ps-provider-id" }),
      }),
    );
  });
});
