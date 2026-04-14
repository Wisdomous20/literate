import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockVerifyUser = vi.hoisted(() => vi.fn());

vi.mock("@/service/auth/verifyUser", () => ({ verifyUser: mockVerifyUser }));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/verify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeRequest({ userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when userId is missing", async () => {
    const res = await POST(makeRequest({ code: "123456" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 with INVALID_TOKEN message when verifyUser fails with that code", async () => {
    mockVerifyUser.mockResolvedValue({ success: false, error: "INVALID_TOKEN" });

    const res = await POST(makeRequest({ code: "123456", userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid verification code.");
  });

  it("returns 400 with TOKEN_EXPIRED message when verifyUser fails with that code", async () => {
    mockVerifyUser.mockResolvedValue({ success: false, error: "TOKEN_EXPIRED" });

    const res = await POST(makeRequest({ code: "123456", userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Verification code has expired.");
  });

  it("returns 400 with fallback message for unknown error codes", async () => {
    mockVerifyUser.mockResolvedValue({ success: false, error: undefined });

    const res = await POST(makeRequest({ code: "123456", userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("An internal error occurred.");
  });

  it("returns 200 with success on valid verification", async () => {
    mockVerifyUser.mockResolvedValue({ success: true });

    const res = await POST(makeRequest({ code: "123456", userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 500 when verifyUser throws", async () => {
    mockVerifyUser.mockRejectedValue(new Error("Unexpected"));

    const res = await POST(makeRequest({ code: "123456", userId: "user-1" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
