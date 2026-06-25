import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationMember: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { updateMemberRoleService } from "../updateMemberRoleService";

const adminOrg = {
  id: "org-1",
  ownerId: "owner-1",
  members: [{ id: "admin-membership", role: "ADMIN" }],
};

const userOrg = {
  id: "org-1",
  ownerId: "owner-1",
  members: [{ id: "user-membership", role: "USER" }],
};

const targetMembership = {
  id: "target-membership",
  userId: "member-1",
  organizationId: "org-1",
  role: "USER",
};

describe("updateMemberRoleService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when requester is not an organization admin", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(userOrg);

    const result = await updateMemberRoleService(
      "member-1",
      "org-1",
      "user-1",
      "ADMIN",
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/admins/);
    expect(mockPrisma.organizationMember.update).not.toHaveBeenCalled();
  });

  it("promotes a regular member to admin", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(adminOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(targetMembership);
    mockPrisma.organizationMember.update.mockResolvedValue({
      ...targetMembership,
      role: "ADMIN",
    });

    const result = await updateMemberRoleService(
      "member-1",
      "org-1",
      "admin-1",
      "ADMIN",
    );

    expect(result.success).toBe(true);
    expect(mockPrisma.organizationMember.update).toHaveBeenCalledWith({
      where: { id: "target-membership" },
      data: { role: "ADMIN" },
    });
  });

  it("demotes an admin member to user", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(adminOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      ...targetMembership,
      role: "ADMIN",
    });
    mockPrisma.organizationMember.update.mockResolvedValue({
      ...targetMembership,
      role: "USER",
    });

    const result = await updateMemberRoleService(
      "member-1",
      "org-1",
      "admin-1",
      "USER",
    );

    expect(result.success).toBe(true);
    expect(mockPrisma.organizationMember.update).toHaveBeenCalledWith({
      where: { id: "target-membership" },
      data: { role: "USER" },
    });
  });

  it("does not change the organization owner's role", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(adminOrg);

    const result = await updateMemberRoleService(
      "owner-1",
      "org-1",
      "admin-1",
      "USER",
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/owner role/);
    expect(mockPrisma.organizationMember.update).not.toHaveBeenCalled();
  });

  it("does not let an admin change their own role", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(adminOrg);

    const result = await updateMemberRoleService(
      "admin-1",
      "org-1",
      "admin-1",
      "USER",
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/own organization role/);
    expect(mockPrisma.organizationMember.update).not.toHaveBeenCalled();
  });

  it("returns failure when the target user is not in the organization", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(adminOrg);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const result = await updateMemberRoleService(
      "member-1",
      "org-1",
      "admin-1",
      "ADMIN",
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a member/);
    expect(mockPrisma.organizationMember.update).not.toHaveBeenCalled();
  });
});
