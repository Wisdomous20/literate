import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedis = vi.hoisted(() => ({
  set: vi.fn(),
  del: vi.fn(),
}));
const mockGenerateVerificationToken = vi.hoisted(() => vi.fn());
const mockSendUserVerificationEmail = vi.hoisted(() => vi.fn());
const mockSendPasswordChangeVerificationEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/redis", () => ({ getRedis: () => mockRedis }));
vi.mock("../generateVerificationToken", () => ({
  generateVerificationToken: mockGenerateVerificationToken,
}));
vi.mock("@/service/notification/sendUserVerificationEmail", () => ({
  sendUserVerificationEmail: mockSendUserVerificationEmail,
}));
vi.mock("@/service/notification/sendPasswordChangeVerificationEmail", () => ({
  sendPasswordChangeVerificationEmail: mockSendPasswordChangeVerificationEmail,
}));

import { sendEmailVerificationCode } from "../sendEmailVerificationCode";

const input = {
  userId: "user-1",
  email: "user@example.com",
  userName: "User",
  purpose: "ACCOUNT_VERIFICATION" as const,
};

describe("sendEmailVerificationCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.del.mockResolvedValue(1);
    mockGenerateVerificationToken.mockResolvedValue({
      success: true,
      token: "123456",
      rollback: vi.fn(),
    });
    mockSendUserVerificationEmail.mockResolvedValue({ messageId: "message-1" });
  });

  it("sends a generated code after acquiring the server-side resend lock", async () => {
    const result = await sendEmailVerificationCode(input);

    expect(result).toEqual({ success: true });
    expect(mockRedis.set).toHaveBeenCalledWith(
      "verification-send:ACCOUNT_VERIFICATION:user-1",
      "1",
      "EX",
      60,
      "NX",
    );
    expect(mockSendUserVerificationEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      userName: "User",
      verificationCode: "123456",
    });
  });

  it("does not generate or send a second code during the cooldown", async () => {
    mockRedis.set.mockResolvedValue(null);

    const result = await sendEmailVerificationCode(input);

    expect(result).toMatchObject({ success: false, code: "RATE_LIMITED" });
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
    expect(mockSendUserVerificationEmail).not.toHaveBeenCalled();
  });

  it("rolls back the replacement code and releases the lock when SMTP fails", async () => {
    const rollback = vi.fn().mockResolvedValue(undefined);
    mockGenerateVerificationToken.mockResolvedValue({
      success: true,
      token: "654321",
      rollback,
    });
    mockSendUserVerificationEmail.mockRejectedValue({ code: "EAUTH" });

    const result = await sendEmailVerificationCode(input);

    expect(result).toMatchObject({ success: false, code: "EMAIL_SEND_FAILED" });
    expect(rollback).toHaveBeenCalledOnce();
    expect(mockRedis.del).toHaveBeenCalledWith(
      "verification-send:ACCOUNT_VERIFICATION:user-1",
    );
  });
});
