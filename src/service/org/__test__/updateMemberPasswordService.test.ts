import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBcryptHash = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationMember: { findUnique: vi.fn() },
  user: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcrypt", () => ({ default: { hash: mockBcryptHash, compare: vi.fn() } }));

import { updateMemberPasswordService } from "../updateMemberPasswordService";

const baseOrg = { ownerId: "owner-1" };
const baseMembership = { id: "mem-1", userId: "member-1", organizationId: "org-1" };

describe("updateMemberPasswordService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when new password is empty", async () => {
    const result = await updateMemberPasswordService("member-1", "", "org-1", "owner-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when new password is shorter than 8 characters", async () => {
    const result = await updateMemberPasswordService("member-1", "short", "org-1", "owner-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/8 characters/);
  });

  it("returns failure when the org does not exist", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await updateMemberPasswordService("member-1", "newpassword", "org-1", "owner-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("returns failure when the requesting user is not the owner", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);

    const result = await updateMemberPasswordService("member-1", "newpassword", "org-1", "not-owner");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/owner/);
  });

  it("returns failure when the owner tries to update their own password", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);

    const result = await updateMemberPasswordService("owner-1", "newpassword", "org-1", "owner-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/own account/);
  });

  it("returns failure when the member is not in the organization", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const result = await updateMemberPasswordService("member-1", "newpassword", "org-1", "owner-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a member/);
  });

  it("hashes the new password before storing it", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(baseMembership);
    mockBcryptHash.mockResolvedValue("hashed_new_password");
    mockPrisma.user.update.mockResolvedValue({});

    await updateMemberPasswordService("member-1", "newpassword", "org-1", "owner-1");

    expect(mockBcryptHash).toHaveBeenCalledWith("newpassword", 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { password: "hashed_new_password" } }),
    );
  });

  it("returns success after updating the password", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(baseMembership);
    mockBcryptHash.mockResolvedValue("hashed_new_password");
    mockPrisma.user.update.mockResolvedValue({});

    const result = await updateMemberPasswordService("member-1", "newpassword", "org-1", "owner-1");

    expect(result.success).toBe(true);
  });
});
