import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organization: { findFirst: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { renameOrganizationService } from "../renameOrganizationService";

const baseOrg = { id: "org-1", name: "Old Name", ownerId: "user-1" };

describe("renameOrganizationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when the new name is empty", async () => {
    const result = await renameOrganizationService("", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findFirst).not.toHaveBeenCalled();
  });

  it("returns failure when the new name is only whitespace", async () => {
    const result = await renameOrganizationService("   ", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organization.findFirst).not.toHaveBeenCalled();
  });

  it("returns failure when the user has no organization", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue(null);

    const result = await renameOrganizationService("New Name", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No organization found/);
    expect(mockPrisma.organization.update).not.toHaveBeenCalled();
  });

  it("updates the organization name on success", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue(baseOrg);
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    const result = await renameOrganizationService("New Name", "user-1");

    expect(result.success).toBe(true);
    expect(result.organization?.name).toBe("New Name");
  });

  it("trims whitespace from the new name before storing", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue(baseOrg);
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    await renameOrganizationService("  New Name  ", "user-1");

    const updateCall = mockPrisma.organization.update.mock.calls[0][0];
    expect(updateCall.data.name).toBe("New Name");
  });

  it("searches for the organization by the requesting user's ownerId", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue(baseOrg);
    mockPrisma.organization.update.mockResolvedValue({ ...baseOrg, name: "New Name" });

    await renameOrganizationService("New Name", "user-99");

    expect(mockPrisma.organization.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: "user-99" } }),
    );
  });
});
