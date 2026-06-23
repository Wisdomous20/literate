import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  webhookDelivery: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  claimXenditWebhookDelivery,
  completeXenditWebhookDelivery,
  releaseXenditWebhookDelivery,
} from "../xenditWebhookDeliveryService";

describe("Xendit webhook delivery claims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims a new delivery before side effects run", async () => {
    mockPrisma.webhookDelivery.create.mockResolvedValue({});

    await expect(claimXenditWebhookDelivery("delivery-1", "recurring.cycle.succeeded")).resolves.toBe(
      "claimed",
    );
    expect(mockPrisma.webhookDelivery.create).toHaveBeenCalledWith({
      data: { id: "delivery-1", event: "recurring.cycle.succeeded" },
    });
  });

  it("treats a unique-constraint conflict as an already claimed replay", async () => {
    mockPrisma.webhookDelivery.create.mockRejectedValue({ code: "P2002" });

    await expect(claimXenditWebhookDelivery("delivery-1", "recurring.cycle.succeeded")).resolves.toBe(
      "duplicate",
    );
  });

  it("records success and releases a failed delivery for a retry", async () => {
    mockPrisma.webhookDelivery.update.mockResolvedValue({});
    mockPrisma.webhookDelivery.delete.mockResolvedValue({});

    await completeXenditWebhookDelivery("delivery-1");
    await releaseXenditWebhookDelivery("delivery-1");

    expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      data: { processedAt: expect.any(Date) },
    });
    expect(mockPrisma.webhookDelivery.delete).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
    });
  });
});
