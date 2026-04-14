import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  user: { update: vi.fn() },
}));

const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockValidatePasswordResetToken = vi.hoisted(() => vi.fn());
const mockDeletePasswordResetToken = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcrypt", () => ({ hash: mockBcryptHash }));
vi.mock("@/service/auth/validatePasswordResetService", () => ({
  validatePasswordResetToken: mockValidatePasswordResetToken,
  deletePasswordResetToken: mockDeletePasswordResetToken,
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when token is missing", async () => {
    const res = await POST(makeRequest({ password: "newpassword" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/token/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ token: "reset-token" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/password/i);
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await POST(makeRequest({ token: "reset-token", password: "short" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/8 characters/i);
  });

  it("returns 400 when the token is invalid", async () => {
    mockValidatePasswordResetToken.mockResolvedValue({
      valid: false,
      error: "Token expired",
    });

    const res = await POST(makeRequest({ token: "bad-token", password: "newpassword" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Token expired");
  });

  it("hashes the new password, updates the user, and deletes the token on success", async () => {
    mockValidatePasswordResetToken.mockResolvedValue({
      valid: true,
      email: "juan@example.com",
    });
    mockBcryptHash.mockResolvedValue("hashed_new_password");
    mockPrisma.user.update.mockResolvedValue({});
    mockDeletePasswordResetToken.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ token: "valid-token", password: "newpassword" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/reset successfully/i);
    expect(mockBcryptHash).toHaveBeenCalledWith("newpassword", 12);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { email: "juan@example.com" },
      data: { password: "hashed_new_password" },
    });
    expect(mockDeletePasswordResetToken).toHaveBeenCalledWith("valid-token");
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    mockValidatePasswordResetToken.mockRejectedValue(new Error("Redis down"));

    const res = await POST(makeRequest({ token: "valid-token", password: "newpassword" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeTruthy();
  });
});
