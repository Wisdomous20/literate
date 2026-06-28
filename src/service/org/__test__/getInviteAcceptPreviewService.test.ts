import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetOrgInvitation = vi.hoisted(() => vi.fn());
const mockGetEffectiveActiveSubscription = vi.hoisted(() => vi.fn());

vi.mock("@/service/org/orgInvitationRedisService", () => ({
  getOrgInvitation: mockGetOrgInvitation,
}));
vi.mock("@/service/subscription/resolveUserSubscription", () => ({
  getEffectiveActiveSubscription: mockGetEffectiveActiveSubscription,
}));

import { getInviteAcceptPreviewService } from "../getInviteAcceptPreviewService";

const validInvitation = {
  tokenHash: "hash",
  payload: { email: "invitee@example.com", organizationId: "org-1" },
};

describe("getInviteAcceptPreviewService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invalid for a missing/expired token without checking subscriptions", async () => {
    mockGetOrgInvitation.mockResolvedValue(null);

    const result = await getInviteAcceptPreviewService("bad-token", "user-1");

    expect(result.valid).toBe(false);
    expect(result.hasActivePersonalSubscription).toBe(false);
    expect(mockGetEffectiveActiveSubscription).not.toHaveBeenCalled();
  });

  it("reports no Solo plan for an unauthenticated (new) invitee", async () => {
    mockGetOrgInvitation.mockResolvedValue(validInvitation);

    const result = await getInviteAcceptPreviewService("token", undefined);

    expect(result.valid).toBe(true);
    expect(result.hasActivePersonalSubscription).toBe(false);
    expect(mockGetEffectiveActiveSubscription).not.toHaveBeenCalled();
  });

  it("surfaces the Solo currentPeriodEnd for a DIRECT subscriber and mutates nothing", async () => {
    const periodEnd = new Date("2027-01-01T00:00:00Z");
    mockGetOrgInvitation.mockResolvedValue(validInvitation);
    mockGetEffectiveActiveSubscription.mockResolvedValue({
      source: "DIRECT",
      subscription: { currentPeriodEnd: periodEnd },
    });

    const result = await getInviteAcceptPreviewService("token", "user-1");

    expect(result).toEqual({
      valid: true,
      hasActivePersonalSubscription: true,
      currentPeriodEnd: periodEnd,
    });
  });

  it("reports no Solo plan when the user's only coverage is from an organization", async () => {
    mockGetOrgInvitation.mockResolvedValue(validInvitation);
    mockGetEffectiveActiveSubscription.mockResolvedValue({
      source: "ORGANIZATION",
      subscription: { currentPeriodEnd: new Date("2027-01-01T00:00:00Z") },
    });

    const result = await getInviteAcceptPreviewService("token", "user-1");

    expect(result.valid).toBe(true);
    expect(result.hasActivePersonalSubscription).toBe(false);
  });
});
