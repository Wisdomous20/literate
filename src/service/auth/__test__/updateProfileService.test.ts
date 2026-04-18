import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { updateProfileService } from "../updateProfileService";

describe("updateProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty first name", async () => {
    const result = await updateProfileService("user-1", {
      firstName: "",
      lastName: "Doe",
    });

    expect(result).toEqual({
      success: false,
      error: "First and last name are required",
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects empty last name", async () => {
    const result = await updateProfileService("user-1", {
      firstName: "Jane",
      lastName: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: "First and last name are required",
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects names longer than 60 characters", async () => {
    const result = await updateProfileService("user-1", {
      firstName: "a".repeat(61),
      lastName: "Doe",
    });

    expect(result).toEqual({ success: false, error: "Name is too long" });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("trims whitespace before persisting and returns the updated user", async () => {
    mockPrisma.user.update.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
    });

    const result = await updateProfileService("user-1", {
      firstName: "  Jane  ",
      lastName: " Doe ",
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { firstName: "Jane", lastName: "Doe" },
      select: { firstName: true, lastName: true },
    });
    expect(result).toEqual({
      success: true,
      user: { firstName: "Jane", lastName: "Doe" },
    });
  });
});
