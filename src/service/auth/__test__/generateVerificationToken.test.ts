import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  ttl: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({ getRedis: () => mockRedis }));

import { generateVerificationToken } from "../generateVerificationToken";

describe("generateVerificationToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.del.mockResolvedValue(1);
  });

  it("creates a six-digit code and restores the previous code on rollback", async () => {
    mockRedis.get
      .mockResolvedValueOnce("111111");
    mockRedis.ttl.mockResolvedValue(45);

    const result = await generateVerificationToken("user-1");

    expect(result.success).toBe(true);
    expect(result.token).toMatch(/^\d{6}$/);
    expect(mockRedis.set).toHaveBeenCalledWith(
      "verification:user-1",
      result.token,
      "EX",
      900,
    );

    mockRedis.get.mockResolvedValueOnce(result.token);
    await result.rollback?.();

    expect(mockRedis.set).toHaveBeenLastCalledWith(
      "verification:user-1",
      "111111",
      "EX",
      45,
    );
  });
});
