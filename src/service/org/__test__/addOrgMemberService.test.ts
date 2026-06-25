import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendInvitationEmail = vi.hoisted(() => vi.fn());
const mockCreateOrgInvitation = vi.hoisted(() => vi.fn());
const mockDiscardOrgInvitation = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  user: { findFirst: vi.fn() },
  organizationMember: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/service/notification/sendOrgInvitationEmail", () => ({
  sendOrgInvitationEmail: mockSendInvitationEmail,
}));
vi.mock("@/service/org/orgInvitationRedisService", () => ({
  createOrgInvitation: mockCreateOrgInvitation,
  discardOrgInvitation: mockDiscardOrgInvitation,
}));

import { addOrgMemberService } from "../addOrgMemberService";

const baseOrg = {
  id: "org-1",
  name: "Sunshine School",
  ownerId: "owner-1",
  owner: { firstName: "Owner", lastName: "Person" },
  subscription: { maxMembers: 5 },
  _count: { members: 2 },
};

const baseInput = {
  email: "member@example.com",
  organizationId: "org-1",
  requestedByUserId: "owner-1",
};

describe("addOrgMemberService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscardOrgInvitation.mockResolvedValue(undefined);
    mockCreateOrgInvitation.mockResolvedValue({
      status: "created",
      token: "raw-invitation-token",
      expiresAt: new Date("2026-06-30T00:00:00.000Z"),
    });
    mockSendInvitationEmail.mockResolvedValue(undefined);
  });

  it("returns failure when email is empty", async () => {
    const result = await addOrgMemberService({ ...baseInput, email: "" });

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when the org does not exist", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No organization found/);
  });

  it("returns failure when the existing user is already a member", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-2" });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ id: "mem-1" });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already a member/);
    expect(mockCreateOrgInvitation).not.toHaveBeenCalled();
  });

  it("returns failure when Redis already has a pending invitation", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockCreateOrgInvitation.mockResolvedValue({ status: "duplicate" });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already pending/);
  });

  it("reserves a Redis invitation and sends its URL by email", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await addOrgMemberService(baseInput);

    expect(result).toMatchObject({
      success: true,
      invitation: { email: "member@example.com" },
    });
    expect(mockCreateOrgInvitation).toHaveBeenCalledWith({
      email: "member@example.com",
      organizationId: "org-1",
      invitedById: "owner-1",
      activeMemberCount: 2,
      maxMembers: 5,
    });

    const emailArgs = mockSendInvitationEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe("member@example.com");
    expect(emailArgs.organizationName).toBe("Sunshine School");
    expect(emailArgs.invitedByName).toBe("Owner Person");
    expect(emailArgs.acceptUrl).toContain("raw-invitation-token");
  });

  it("normalizes the invitation email before storing it in Redis", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await addOrgMemberService({ ...baseInput, email: "MEMBER@EXAMPLE.COM" });

    expect(mockCreateOrgInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ email: "member@example.com" }),
    );
  });

  it("releases the Redis seat hold when email delivery fails", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockSendInvitationEmail.mockRejectedValue(new Error("SMTP down"));

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Could not send invitation/);
    expect(mockDiscardOrgInvitation).toHaveBeenCalledWith(
      "raw-invitation-token",
      expect.objectContaining({ email: "member@example.com" }),
    );
  });
});
