import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  organizationMember: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getOrgMembersService } from "../getOrgMembersService";

const baseOrg = {
  id: "org-1",
  name: "Sunshine School",
  ownerId: "user-1",
  subscription: { planType: "BASIC", maxMembers: 5 },
  _count: { members: 2 },
};

const baseMembers = [
  {
    id: "mem-1",
    userId: "user-1",
    joinedAt: new Date("2024-01-01"),
    user: { id: "user-1", firstName: "Juan", lastName: "dela Cruz", email: "juan@example.com", isDisabled: false, createdAt: new Date() },
  },
  {
    id: "mem-2",
    userId: "user-2",
    joinedAt: new Date("2024-02-01"),
    user: { id: "user-2", firstName: "Maria", lastName: "Santos", email: "maria@example.com", isDisabled: false, createdAt: new Date() },
  },
];

describe("getOrgMembersService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when the org does not exist", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await getOrgMembersService("org-1", "user-1");

    expect(result.success).toBe(false);
    expect(mockPrisma.organizationMember.findMany).not.toHaveBeenCalled();
  });

  it("returns failure when the requesting user is not the owner", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ ...baseOrg, ownerId: "user-1" });

    const result = await getOrgMembersService("org-1", "user-999");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/owner/);
  });

  it("returns the organization summary and member list on success", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findMany.mockResolvedValue(baseMembers);

    const result = await getOrgMembersService("org-1", "user-1");

    expect(result.success).toBe(true);
    expect(result.organization).toMatchObject({ id: "org-1", name: "Sunshine School", plan: "BASIC", maxMembers: 5, currentMembers: 2 });
    expect(result.members).toHaveLength(2);
  });

  it("marks the owner as isOwner: true in the member list", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findMany.mockResolvedValue(baseMembers);

    const result = await getOrgMembersService("org-1", "user-1");

    const owner = result.members?.find((m) => m.id === "user-1");
    expect(owner?.isOwner).toBe(true);

    const nonOwner = result.members?.find((m) => m.id === "user-2");
    expect(nonOwner?.isOwner).toBe(false);
  });

  it("returns null plan when organization has no subscription", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ ...baseOrg, subscription: null });
    mockPrisma.organizationMember.findMany.mockResolvedValue([]);

    const result = await getOrgMembersService("org-1", "user-1");

    expect(result.organization?.plan).toBeNull();
    expect(result.organization?.maxMembers).toBe(0);
  });

  it("queries members ordered by joinedAt ascending", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.organizationMember.findMany.mockResolvedValue([]);

    await getOrgMembersService("org-1", "user-1");

    const query = mockPrisma.organizationMember.findMany.mock.calls[0][0];
    expect(query.orderBy).toEqual({ joinedAt: "asc" });
  });
});
