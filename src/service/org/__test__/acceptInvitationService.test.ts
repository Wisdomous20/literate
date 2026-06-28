import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetOrgInvitation = vi.hoisted(() => vi.fn());
const mockClaimOrgInvitation = vi.hoisted(() => vi.fn());
const mockConsumeOrgInvitation = vi.hoisted(() => vi.fn());
const mockReleaseOrgInvitationClaim = vi.hoisted(() => vi.fn());
const mockStopSubscriptionRenewal = vi.hoisted(() => vi.fn());
const mockHashPassword = vi.hoisted(() => vi.fn());

const transactionClient = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationMember: { findUnique: vi.fn(), create: vi.fn() },
  user: { create: vi.fn() },
}));

const mockPrisma = vi.hoisted(() => ({
  user: { findFirst: vi.fn() },
  classRoom: { create: vi.fn() },
  $transaction: vi.fn((callback) => callback(transactionClient)),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcrypt", () => ({ default: { hash: mockHashPassword } }));
vi.mock("@/service/subscription/stopSubscriptionRenewalService", () => ({
  stopSubscriptionRenewalService: mockStopSubscriptionRenewal,
}));
vi.mock("@/service/org/orgInvitationRedisService", () => ({
  getOrgInvitation: mockGetOrgInvitation,
  claimOrgInvitation: mockClaimOrgInvitation,
  consumeOrgInvitation: mockConsumeOrgInvitation,
  releaseOrgInvitationClaim: mockReleaseOrgInvitationClaim,
}));

import { acceptInvitationService } from "../acceptInvitationService";

const invitation = {
  tokenHash: "token-hash",
  payload: {
    email: "member@example.com",
    organizationId: "org-1",
    invitedById: "owner-1",
    expiresAt: "2026-07-01T00:00:00.000Z",
  },
};

const organization = {
  id: "org-1",
  currentSubscription: { maxMembersSnapshot: 5 },
  _count: { members: 1 },
};

const soloPeriodEnd = new Date("2027-01-01T00:00:00Z");

describe("acceptInvitationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrgInvitation.mockResolvedValue(invitation);
    mockClaimOrgInvitation.mockResolvedValue("claim-1");
    mockReleaseOrgInvitationClaim.mockResolvedValue(undefined);
    mockConsumeOrgInvitation.mockResolvedValue(undefined);
    mockStopSubscriptionRenewal.mockResolvedValue({
      success: true,
      alreadyStopped: false,
      currentPeriodEnd: soloPeriodEnd,
    });
    mockHashPassword.mockResolvedValue("hashed-password");
    transactionClient.organization.findUnique.mockResolvedValue(organization);
    transactionClient.organizationMember.findUnique.mockResolvedValue(null);
    transactionClient.organizationMember.create.mockResolvedValue({ id: "member-1" });
    transactionClient.user.create.mockResolvedValue({ id: "user-1" });
    mockPrisma.classRoom.create.mockResolvedValue({ id: "class-1" });
  });

  it("rejects an existing account when a different account is signed in", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-existing" });

    const result = await acceptInvitationService({
      token: "raw-token",
      authenticatedUserId: "other-user",
    });

    expect(result).toMatchObject({ success: false, error: expect.stringMatching(/Sign in/) });
    expect(mockClaimOrgInvitation).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("requires a new invitee to supply their own profile details", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await acceptInvitationService({
      token: "raw-token",
      password: "password123",
    });

    expect(result).toMatchObject({ success: false, error: expect.stringMatching(/First and last/) });
    expect(mockClaimOrgInvitation).not.toHaveBeenCalled();
  });

  it("does not mutate membership when another request is already accepting the invite", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-existing" });
    mockClaimOrgInvitation.mockResolvedValue(null);

    const result = await acceptInvitationService({
      token: "raw-token",
      authenticatedUserId: "user-existing",
    });

    expect(result).toMatchObject({ success: false, error: expect.stringMatching(/already being accepted/) });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not create a user or membership when no paid seat remains", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    transactionClient.organization.findUnique.mockResolvedValue({
      ...organization,
      currentSubscription: { maxMembersSnapshot: 1 },
      _count: { members: 1 },
    });

    const result = await acceptInvitationService({
      token: "raw-token",
      firstName: "Ana",
      lastName: "Reyes",
      password: "password123",
    });

    expect(result).toMatchObject({ success: false, error: expect.stringMatching(/no seats/) });
    expect(transactionClient.user.create).not.toHaveBeenCalled();
    expect(transactionClient.organizationMember.create).not.toHaveBeenCalled();
    expect(mockConsumeOrgInvitation).not.toHaveBeenCalled();
  });

  it("adds the authenticated invited user as an organization member and consumes the token", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-existing" });

    const result = await acceptInvitationService({
      token: "raw-token",
      authenticatedUserId: "user-existing",
    });

    expect(result).toEqual({
      success: true,
      email: "member@example.com",
      createdAccount: false,
      soloActiveUntil: soloPeriodEnd,
    });
    expect(transactionClient.organizationMember.create).toHaveBeenCalledWith({
      data: { userId: "user-existing", organizationId: "org-1", role: "USER" },
    });
    expect(mockConsumeOrgInvitation).toHaveBeenCalledWith(
      "token-hash",
      "claim-1",
      invitation.payload,
    );
    expect(mockStopSubscriptionRenewal).toHaveBeenCalledWith("user-existing");
  });

  it("creates the new user's profile from acceptance input, never from the invitation", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await acceptInvitationService({
      token: "raw-token",
      firstName: "Ana",
      lastName: "Reyes",
      password: "password123",
    });

    expect(result).toMatchObject({ success: true, createdAccount: true });
    expect(transactionClient.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: "Ana",
        lastName: "Reyes",
        email: "member@example.com",
        password: "hashed-password",
      }),
      select: { id: true },
    });
    expect(mockPrisma.classRoom.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1" }),
    });
  });
});
