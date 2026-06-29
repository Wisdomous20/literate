import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { renameOrganizationService } from "../renameOrganizationService";

const baseOrg = { id: "org-1", name: "Old Name", ownerId: "user-1" };

describe("renameOrganizationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when the new name is empty", async () => {
    const result = await renameOrganizationService("", "org-1", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when the new name is only whitespace", async () => {
    const result = await renameOrganizationService("   ", "org-1", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when the user has no organization", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await renameOrganizationService("New Name", "org-1", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No organization found/);
    expect(mockPrisma.organization.update).not.toHaveBeenCalled();
  });

  it("updates the organization name on success", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      members: [
        { id: "owner-membership", userId: "user-1", role: "OWNER" },
      ],
    });
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    const result = await renameOrganizationService("New Name", "org-1", "user-1");

    expect(result.success).toBe(true);
    expect(result.organization?.name).toBe("New Name");
  });

  it("trims whitespace from the new name before storing", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      members: [
        { id: "owner-membership", userId: "user-1", role: "OWNER" },
      ],
    });
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    await renameOrganizationService("  New Name  ", "org-1", "user-1");

    const updateCall = mockPrisma.organization.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe("New Name");
  });

  it("checks the requested organization for admin membership", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      members: [
        { id: "admin-membership", userId: "user-99", role: "ADMIN" },
        { id: "owner-membership", userId: "user-1", role: "OWNER" },
      ],
    });
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    await renameOrganizationService("New Name", "org-1", "user-99");

    expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org-1" },
      }),
    );
  });
});
