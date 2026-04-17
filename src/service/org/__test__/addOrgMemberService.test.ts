import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendInvitationEmail = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  user: { findFirst: vi.fn() },
  organizationMember: { findUnique: vi.fn() },
  organizationInvitation: {
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/service/notification/sendOrgInvitationEmail", () => ({
  sendOrgInvitationEmail: mockSendInvitationEmail,
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
  firstName: "Ana",
  lastName: "Reyes",
  organizationId: "org-1",
  requestedByUserId: "owner-1",
};

describe("addOrgMemberService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.organizationInvitation.count.mockResolvedValue(0);
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null);
    mockPrisma.organizationInvitation.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: "inv-1", ...data })
    );
    mockSendInvitationEmail.mockResolvedValue(undefined);
  });

  it("returns failure when email is empty", async () => {
    const result = await addOrgMemberService({ ...baseInput, email: "" });

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when firstName is empty", async () => {
    const result = await addOrgMemberService({ ...baseInput, firstName: "" });

    expect(result.success).toBe(false);
  });

  it("returns failure when email format is invalid", async () => {
    const result = await addOrgMemberService({ ...baseInput, email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid email/);
  });

  it("returns failure when the org does not exist or the requester is not the owner", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/owner/);
  });

  it("returns failure when active members plus pending invitations reach the limit", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      subscription: { maxMembers: 3 },
      _count: { members: 2 },
    });
    mockPrisma.organizationInvitation.count.mockResolvedValue(1);

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Seat limit reached/);
    expect(mockPrisma.organizationInvitation.create).not.toHaveBeenCalled();
  });

  it("returns failure when the existing user is already a member", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-2" });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ id: "mem-1" });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already a member/);
    expect(mockPrisma.organizationInvitation.create).not.toHaveBeenCalled();
  });

  it("returns failure when a pending invitation already exists for the email", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue({ id: "inv-existing" });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already pending/);
    expect(mockPrisma.organizationInvitation.create).not.toHaveBeenCalled();
  });

  it("creates an invitation and sends the email when the email is not registered", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(true);
    expect(result.invitation?.email).toBe("member@example.com");

    const createCall = mockPrisma.organizationInvitation.create.mock.calls[0][0];
    expect(createCall.data.organizationId).toBe("org-1");
    expect(createCall.data.invitedById).toBe("owner-1");
    expect(typeof createCall.data.token).toBe("string");
    expect(createCall.data.expiresAt).toBeInstanceOf(Date);

    expect(mockSendInvitationEmail).toHaveBeenCalledTimes(1);
    const emailArgs = mockSendInvitationEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe("member@example.com");
    expect(emailArgs.organizationName).toBe("Sunshine School");
    expect(emailArgs.invitedByName).toBe("Owner Person");
    expect(emailArgs.acceptUrl).toContain(createCall.data.token);
  });

  it("creates an invitation for an existing user who is not yet a member", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-2" });
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(true);
    expect(mockPrisma.organizationInvitation.create).toHaveBeenCalledTimes(1);
    expect(mockSendInvitationEmail).toHaveBeenCalledTimes(1);
  });

  it("stores the email in lowercase on the invitation", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await addOrgMemberService({ ...baseInput, email: "MEMBER@EXAMPLE.COM" });

    const createCall = mockPrisma.organizationInvitation.create.mock.calls[0][0];
    expect(createCall.data.email).toBe("member@example.com");
  });

  it("rolls back the invitation and returns failure when the email send fails", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockSendInvitationEmail.mockRejectedValue(new Error("SMTP down"));

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Could not send invitation/);
    expect(mockPrisma.organizationInvitation.delete).toHaveBeenCalledWith({
      where: { id: "inv-1" },
    });
  });

  it("falls back to a generic sender name when the owner has no name", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      owner: { firstName: null, lastName: null },
    });
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await addOrgMemberService(baseInput);

    const emailArgs = mockSendInvitationEmail.mock.calls[0][0];
    expect(emailArgs.invitedByName).toBe("Your organization admin");
  });
});
