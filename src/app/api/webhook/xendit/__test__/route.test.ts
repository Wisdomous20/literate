import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  subscription: { updateMany: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn() },
  organization: { findFirst: vi.fn(), create: vi.fn() },
  organizationMember: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { POST } from "../route";

const VALID_TOKEN = "xendit-secret-token";

function makeRequest(body: Record<string, unknown>, token?: string) {
  return new NextRequest("http://localhost/api/webhook/xendit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-callback-token": token ?? VALID_TOKEN,
    },
  });
}

describe("POST /api/webhook/xendit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.XENDIT_WEBHOOK_TOKEN = VALID_TOKEN;
  });

  it("returns 401 when the webhook token is missing", async () => {
    const req = new NextRequest("http://localhost/api/webhook/xendit", {
      method: "POST",
      body: JSON.stringify({ event: "recurring.plan.activated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid token");
  });

  it("returns 401 when the webhook token is wrong", async () => {
    const res = await POST(makeRequest({ event: "recurring.plan.activated" }, "wrong-token"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid token");
  });

  it("handles recurring.plan.activated and activates the subscription", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});
    mockPrisma.user.findUnique.mockResolvedValue({ firstName: "Juan", lastName: "Cruz" });
    mockPrisma.$transaction.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.plan.activated",
        data: { id: "plan-1", metadata: { planType: "SOLO" } },
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-1" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });

  it("upgrades user to ORG_ADMIN and creates org for non-SOLO plan activation", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.organization.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ firstName: "Ana", lastName: "Reyes" });
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
    mockPrisma.organization.create.mockResolvedValue({ id: "org-1" });
    mockPrisma.organizationMember.create.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.plan.activated",
        data: {
          id: "plan-1",
          metadata: { userId: "user-1", planType: "TEAM", maxMembers: "5" },
        },
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { role: "ORG_ADMIN" },
      }),
    );
  });

  it("handles recurring.plan.inactivated and cancels the subscription", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.plan.inactivated",
        data: { id: "plan-1" },
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-1" },
        data: { status: "CANCELED" },
      }),
    );
  });

  it("handles recurring.cycle.succeeded and keeps subscription active", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.cycle.succeeded",
        data: { plan_id: "plan-1" },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-1" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });

  it("handles recurring.cycle.retrying and marks subscription as past-due", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.cycle.retrying",
        data: { plan_id: "plan-1" },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-1" },
        data: { status: "PAST_DUE" },
      }),
    );
  });

  it("handles recurring.cycle.failed and marks subscription as expired", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        event: "recurring.cycle.failed",
        data: { plan_id: "plan-1" },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { xenditPlanId: "plan-1" },
        data: { status: "EXPIRED" },
      }),
    );
  });

  it("ignores unknown events and returns received true", async () => {
    const res = await POST(makeRequest({ event: "unknown.event", data: {} }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
  });

  it("returns 500 when prisma throws inside an event handler", async () => {
    mockPrisma.subscription.updateMany.mockRejectedValue(new Error("DB error"));

    const res = await POST(
      makeRequest({
        event: "recurring.cycle.failed",
        data: { plan_id: "plan-1" },
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
