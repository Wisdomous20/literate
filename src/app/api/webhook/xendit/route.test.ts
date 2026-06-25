import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  subscription: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const mockClaimXenditWebhookDelivery = vi.hoisted(() => vi.fn());
const mockCompleteXenditWebhookDelivery = vi.hoisted(() => vi.fn());
const mockReleaseXenditWebhookDelivery = vi.hoisted(() => vi.fn());
const mockCreateInvoiceAndSendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/service/subscription/xenditWebhookDeliveryService", () => ({
  claimXenditWebhookDelivery: mockClaimXenditWebhookDelivery,
  completeXenditWebhookDelivery: mockCompleteXenditWebhookDelivery,
  releaseXenditWebhookDelivery: mockReleaseXenditWebhookDelivery,
}));
vi.mock("@/service/subscription/invoiceService", () => ({
  createInvoiceAndSendEmail: mockCreateInvoiceAndSendEmail,
}));

import { POST } from "./route";

const webhookToken = "test-webhook-token";

function createWebhookRequest(payload: unknown): Request {
  return new Request("http://localhost/api/webhook/xendit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-callback-token": webhookToken,
    },
    body: JSON.stringify(payload),
  });
}

describe("Xendit webhook invoice side effects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.XENDIT_WEBHOOK_TOKEN = webhookToken;
    mockClaimXenditWebhookDelivery.mockResolvedValue("claimed");
    mockCompleteXenditWebhookDelivery.mockResolvedValue(undefined);
    mockReleaseXenditWebhookDelivery.mockResolvedValue(undefined);
    mockCreateInvoiceAndSendEmail.mockResolvedValue({});
    mockPrisma.subscription.update.mockResolvedValue({ id: "sub-1" });
  });

  it("activates the plan without creating an invoice", async () => {
    const response = await POST(
      createWebhookRequest({
        event: "recurring.plan.activated",
        data: {
          id: "plan-1",
          metadata: { maxMembers: "5" },
        },
      }) as never,
    );

    await expect(response.json()).resolves.toEqual({ received: true });
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { xenditPlanId: "plan-1" },
      data: {
        status: "ACTIVE",
        maxMembersSnapshot: 5,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
      },
    });
    expect(mockCreateInvoiceAndSendEmail).not.toHaveBeenCalled();
  });

  it("creates exactly one invoice when activation and cycle success arrive for the same first payment", async () => {
    await POST(
      createWebhookRequest({
        event: "recurring.plan.activated",
        data: {
          id: "plan-1",
          metadata: { maxMembers: "5" },
        },
      }) as never,
    );

    await POST(
      createWebhookRequest({
        event: "recurring.cycle.succeeded",
        data: {
          id: "cycle-1",
          plan_id: "plan-1",
        },
      }) as never,
    );

    expect(mockCreateInvoiceAndSendEmail).toHaveBeenCalledTimes(1);
    expect(mockCreateInvoiceAndSendEmail).toHaveBeenCalledWith({
      subscriptionId: "sub-1",
      providerInvoiceId: expect.stringMatching(
        /^xendit:recurring\.cycle\.succeeded:plan-1:\d{4}-\d{2}-\d{2}$/,
      ),
      providerPaymentId: "cycle-1",
      providerPayload: {
        id: "cycle-1",
        plan_id: "plan-1",
      },
    });
  });
});
