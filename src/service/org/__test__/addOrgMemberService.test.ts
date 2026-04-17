import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockGenerateOrgPassword = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  organization: { findUnique: vi.fn() },
  user: { findUnique: vi.fn(), create: vi.fn() },
  organizationMember: { findUnique: vi.fn(), create: vi.fn() },
  classRoom: { create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcrypt", () => ({ default: { hash: mockBcryptHash, compare: vi.fn() } }));
vi.mock("@/utils/generateOrgPassword", () => ({ generateOrgPassword: mockGenerateOrgPassword }));

import { addOrgMemberService } from "../addOrgMemberService";

const baseOrg = {
  id: "org-1",
  name: "Sunshine School",
  ownerId: "owner-1",
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
    mockGenerateOrgPassword.mockReturnValue("TempPass123");
    mockBcryptHash.mockResolvedValue("hashed_password");
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

  it("returns failure when the member limit has been reached", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({
      ...baseOrg,
      subscription: { maxMembers: 2 },
      _count: { members: 2 },
    });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/limit reached/);
  });

  it("returns failure when the existing user is already a member", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-2", email: "member@example.com" });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ id: "mem-1" });

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already a member/);
  });

  it("adds an existing user to the org without creating a new account", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-2", email: "member@example.com", firstName: "Ana", lastName: "Reyes" });
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
    mockPrisma.organizationMember.create.mockResolvedValue({});

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(true);
    expect(result.member?.isNewAccount).toBe(false);
    expect(result.tempPassword).toBeNull();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a new verified user and default class when the email is not registered", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "new-user", email: "member@example.com", firstName: "Ana", lastName: "Reyes" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.classRoom.create.mockResolvedValue({});

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(true);
    expect(result.member?.isNewAccount).toBe(true);
    expect(result.tempPassword).toBe("TempPass123");

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.isVerified).toBe(true);
    expect(createCall.data.role).toBe("USER");
  });

  it("stores the email in lowercase when creating a new user", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "new-user", email: "member@example.com", firstName: "Ana", lastName: "Reyes" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.classRoom.create.mockResolvedValue({});

    await addOrgMemberService({ ...baseInput, email: "MEMBER@EXAMPLE.COM" });

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.email).toBe("member@example.com");
  });

  it("hashes the generated temp password before storing it", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "new-user", email: "member@example.com", firstName: "Ana", lastName: "Reyes" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.classRoom.create.mockResolvedValue({});

    await addOrgMemberService(baseInput);

    expect(mockBcryptHash).toHaveBeenCalledWith("TempPass123", 10);
    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).toBe("hashed_password");
  });

  it("still returns success even if the default class creation fails", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(baseOrg);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "new-user", email: "member@example.com", firstName: "Ana", lastName: "Reyes" });
    mockPrisma.organizationMember.create.mockResolvedValue({});
    mockPrisma.classRoom.create.mockRejectedValue(new Error("DB error"));

    const result = await addOrgMemberService(baseInput);

    expect(result.success).toBe(true);
  });
});
