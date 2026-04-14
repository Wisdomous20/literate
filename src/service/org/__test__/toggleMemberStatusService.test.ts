import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationMember: { findUnique: vi.fn() },
  user: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { toggleMemberStatusService } from "../toggleMemberStatusService";

const baseOrg = { ownerId: "owner-1" };
const baseMembership = { id: "mem-1", userId: "member-1", organizationId: "org-1" };

describe("toggleMemberStatusService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when the org does not exist", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await toggleMemberStatusService("member-1", "org-1", "owner-1", true);

    expect(result.success).toBe(false);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("returns failure when the requesting user is not the owner", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);

    const result = await toggleMemberStatusService("member-1", "org-1", "other-user", true);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/owner/);
  });

  it("returns failure when the owner tries to disable their own account", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);

    const result = await toggleMemberStatusService("owner-1", "org-1", "owner-1", true);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot disable/);
  });

  it("returns failure when the member is not in the organization", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const result = await toggleMemberStatusService("member-1", "org-1", "owner-1", true);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a member/);
  });

  it("disables the member and returns a success message when disable is true", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(baseMembership);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await toggleMemberStatusService("member-1", "org-1", "owner-1", true);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Member disabled");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isDisabled: true } }),
    );
  });

  it("enables the member and returns a success message when disable is false", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(baseMembership);
    mockPrisma.user.update.mockResolvedValue({});

    const result = await toggleMemberStatusService("member-1", "org-1", "owner-1", false);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Member enabled");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isDisabled: false } }),
    );
  });
});
