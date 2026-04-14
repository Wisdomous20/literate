import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  organization: { findFirst: vi.fn(), create: vi.fn() },
  organizationMember: { create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { createOrganizationService } from "../createOrganizationService";

const orgAdmin = { role: "ORG_ADMIN" };
const regularUser = { role: "USER" };
const baseOrg = { id: "org-1", name: "Sunshine School", ownerId: "user-1" };

describe("createOrganizationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when name is empty", async () => {
    const result = await createOrganizationService("", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when name is only whitespace", async () => {
    const result = await createOrganizationService("   ", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when the user is not an ORG_ADMIN", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(regularUser);

    const result = await createOrganizationService("Sunshine School", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ORG_ADMIN/);
    expect(mockPrisma.organization.create).not.toHaveBeenCalled();
  });

  it("returns failure when the user already owns an organization", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(orgAdmin);
    mockPrisma.organization.findFirst.mockResolvedValue(baseOrg);

    const result = await createOrganizationService("Another Org", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already own/);
    expect(mockPrisma.organization.create).not.toHaveBeenCalled();
  });

  it("creates the organization and adds the owner as a member on success", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(orgAdmin);
    mockPrisma.organization.findFirst.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.create.mockResolvedValue({});

    const result = await createOrganizationService("Sunshine School", "user-1");

    expect(result.success).toBe(true);
    expect(result.organization).toMatchObject({ id: "org-1", name: "Sunshine School" });
    expect(mockPrisma.organizationMember.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "user-1", organizationId: "org-1" } }),
    );
  });

  it("trims whitespace from the name before storing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(orgAdmin);
    mockPrisma.organization.findFirst.mockResolvedValue(null);
    mockPrisma.organization.create.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.create.mockResolvedValue({});

    await createOrganizationService("  Sunshine School  ", "user-1");

    const createCall = mockPrisma.organization.create.mock.calls[0][0];
    expect(createCall.data.name).toBe("Sunshine School");
  });
});
