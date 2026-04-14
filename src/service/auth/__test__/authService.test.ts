import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const mockBcryptCompare = vi.hoisted(() => vi.fn());
const mockBcryptHash = vi.hoisted(() => vi.fn());

const mockValidateVerificationToken = vi.hoisted(() => vi.fn());
const mockDeleteVerificationToken = vi.hoisted(() => vi.fn());
const mockGenerateVerificationToken = vi.hoisted(() => vi.fn());
const mockSendPasswordChangeVerificationEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("bcrypt", () => ({
  default: { compare: mockBcryptCompare, hash: mockBcryptHash },
}));
vi.mock("@/service/auth/generateVerificationToken", () => ({
  validateVerificationToken: mockValidateVerificationToken,
  deleteVerificationToken: mockDeleteVerificationToken,
  generateVerificationToken: mockGenerateVerificationToken,
}));
vi.mock("@/service/notification/sendPasswordChangeVerificationEmail", () => ({
  sendPasswordChangeVerificationEmail: mockSendPasswordChangeVerificationEmail,
}));

import { loginUser } from "../login";
import { registerUser } from "../registerUser";
import { registerAdminUser } from "../registerAdminUser";
import { verifyUser } from "../verifyUser";
import {
  requestPasswordChangeService,
  confirmPasswordChangeService,
} from "../requestPasswordChangeService";

const baseUser = {
  id: "user-1",
  firstName: "Juan",
  lastName: "dela Cruz",
  email: "juan@example.com",
  password: "hashed_password",
  isVerified: true,
  isDisabled: false,
};

// ─── loginUser ────────────────────────────────────────────────────────────────

describe("loginUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns INVALID_CREDENTIALS when email is missing", async () => {
    const result = await loginUser({ email: "", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INVALID_CREDENTIALS");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns INVALID_CREDENTIALS when password is missing", async () => {
    const result = await loginUser({ email: "juan@example.com", password: "" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INVALID_CREDENTIALS");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns USER_NOT_FOUND when no user matches the email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await loginUser({ email: "ghost@example.com", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("USER_NOT_FOUND");
  });

  it("returns INVALID_CREDENTIALS when user has no stored password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, password: null });

    const result = await loginUser({ email: "juan@example.com", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns INVALID_CREDENTIALS when password does not match", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockBcryptCompare.mockResolvedValue(false);

    const result = await loginUser({ email: "juan@example.com", password: "wrong" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns ACCOUNT_DISABLED when account is disabled", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isDisabled: true });
    mockBcryptCompare.mockResolvedValue(true);

    const result = await loginUser({ email: "juan@example.com", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("ACCOUNT_DISABLED");
  });

  it("returns EMAIL_NOT_VERIFIED when account is not verified", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isVerified: false });
    mockBcryptCompare.mockResolvedValue(true);

    const result = await loginUser({ email: "juan@example.com", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns success with user data on valid credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockBcryptCompare.mockResolvedValue(true);

    const result = await loginUser({ email: "juan@example.com", password: "secret123" });

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      id: "user-1",
      email: "juan@example.com",
      firstName: "Juan",
      lastName: "dela Cruz",
    });
  });

  it("returns INTERNAL_ERROR when prisma throws", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB down"));

    const result = await loginUser({ email: "juan@example.com", password: "secret123" });

    expect(result.success).toBe(false);
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

// ─── registerUser ─────────────────────────────────────────────────────────────

describe("registerUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when a required field is missing", async () => {
    const result = await registerUser({
      firstName: "",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when email format is invalid", async () => {
    const result = await registerUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns VALIDATION_ERROR when password is shorter than 8 characters", async () => {
    const result = await registerUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns USER_EXISTS when email is already taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await registerUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("USER_EXISTS");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("creates and returns the new user on valid input", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashed_password");
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      createdAt: new Date("2024-01-01"),
    });

    const result = await registerUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({ id: "user-1", email: "juan@example.com" });
  });

  it("hashes the password before storing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashed_password");
    mockPrisma.user.create.mockResolvedValue({
      id: "user-1",
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      createdAt: new Date(),
    });

    await registerUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(mockBcryptHash).toHaveBeenCalledWith("secret123", 10);
    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).toBe("hashed_password");
  });
});

// ─── registerAdminUser ────────────────────────────────────────────────────────

describe("registerAdminUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VALIDATION_ERROR when a required field is missing", async () => {
    const result = await registerAdminUser({
      firstName: "Juan",
      lastName: "",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("returns USER_EXISTS when email is already taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const result = await registerAdminUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("USER_EXISTS");
  });

  it("creates admin with isVerified true and role ADMIN", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashed_password");
    mockPrisma.user.create.mockResolvedValue({
      id: "admin-1",
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      createdAt: new Date(),
    });

    const result = await registerAdminUser({
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.isVerified).toBe(true);
    expect(createCall.data.role).toBe("ADMIN");
  });
});

// ─── verifyUser ───────────────────────────────────────────────────────────────

describe("verifyUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns INVALID_TOKEN when token validation fails", async () => {
    mockValidateVerificationToken.mockResolvedValue({ valid: false });

    const result = await verifyUser("bad-token", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_TOKEN");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("marks the user as verified on a valid token", async () => {
    mockValidateVerificationToken.mockResolvedValue({ valid: true });
    mockPrisma.user.update.mockResolvedValue({});
    mockDeleteVerificationToken.mockResolvedValue(undefined);

    const result = await verifyUser("valid-token", "user-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isVerified: true },
    });
  });

  it("deletes the token after successful verification", async () => {
    mockValidateVerificationToken.mockResolvedValue({ valid: true });
    mockPrisma.user.update.mockResolvedValue({});
    mockDeleteVerificationToken.mockResolvedValue(undefined);

    await verifyUser("valid-token", "user-1");

    expect(mockDeleteVerificationToken).toHaveBeenCalledWith("user-1");
  });

  it("returns INTERNAL_ERROR when an exception is thrown", async () => {
    mockValidateVerificationToken.mockRejectedValue(new Error("Redis down"));

    const result = await verifyUser("valid-token", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("INTERNAL_ERROR");
  });
});

// ─── requestPasswordChangeService ────────────────────────────────────────────

describe("requestPasswordChangeService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when currentPassword is empty", async () => {
    const result = await requestPasswordChangeService("user-1", "");

    expect(result.success).toBe(false);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when user is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await requestPasswordChangeService("user-1", "secret123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("returns failure when current password is incorrect", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      password: "hashed_password",
      email: "juan@example.com",
      firstName: "Juan",
    });
    mockBcryptCompare.mockResolvedValue(false);

    const result = await requestPasswordChangeService("user-1", "wrong-password");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Current password is incorrect");
  });

  it("returns failure when token generation fails", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      password: "hashed_password",
      email: "juan@example.com",
      firstName: "Juan",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateVerificationToken.mockResolvedValue({ success: false });

    const result = await requestPasswordChangeService("user-1", "secret123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to generate verification code");
  });

  it("sends verification email and returns success on valid password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      password: "hashed_password",
      email: "juan@example.com",
      firstName: "Juan",
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateVerificationToken.mockResolvedValue({ success: true, token: "123456" });
    mockSendPasswordChangeVerificationEmail.mockResolvedValue(undefined);

    const result = await requestPasswordChangeService("user-1", "secret123");

    expect(result.success).toBe(true);
    expect(mockSendPasswordChangeVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "juan@example.com", verificationCode: "123456" }),
    );
  });
});

// ─── confirmPasswordChangeService ────────────────────────────────────────────

describe("confirmPasswordChangeService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when code is not exactly 6 digits", async () => {
    const result = await confirmPasswordChangeService("user-1", "12345", "newpassword");

    expect(result.success).toBe(false);
    expect(mockValidateVerificationToken).not.toHaveBeenCalled();
  });

  it("returns failure when code contains non-digit characters", async () => {
    const result = await confirmPasswordChangeService("user-1", "12345a", "newpassword");

    expect(result.success).toBe(false);
    expect(mockValidateVerificationToken).not.toHaveBeenCalled();
  });

  it("returns failure when new password is shorter than 8 characters", async () => {
    const result = await confirmPasswordChangeService("user-1", "123456", "short");

    expect(result.success).toBe(false);
  });

  it("returns failure when token is invalid", async () => {
    mockValidateVerificationToken.mockResolvedValue({
      valid: false,
      error: "Invalid verification code",
    });

    const result = await confirmPasswordChangeService("user-1", "123456", "newpassword");

    expect(result.success).toBe(false);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns failure when new password is the same as the current password", async () => {
    mockValidateVerificationToken.mockResolvedValue({ valid: true });
    mockPrisma.user.findUnique.mockResolvedValue({ password: "hashed_password" });
    mockBcryptCompare.mockResolvedValue(true);

    const result = await confirmPasswordChangeService("user-1", "123456", "newpassword");

    expect(result.success).toBe(false);
    expect(result.error).toBe("New password must be different from current password");
  });

  it("updates the password and deletes the token on success", async () => {
    mockValidateVerificationToken.mockResolvedValue({ valid: true });
    mockPrisma.user.findUnique.mockResolvedValue({ password: "hashed_old_password" });
    mockBcryptCompare.mockResolvedValue(false);
    mockBcryptHash.mockResolvedValue("hashed_new_password");
    mockPrisma.user.update.mockResolvedValue({});
    mockDeleteVerificationToken.mockResolvedValue(undefined);

    const result = await confirmPasswordChangeService("user-1", "123456", "newpassword");

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "hashed_new_password" },
    });
    expect(mockDeleteVerificationToken).toHaveBeenCalledWith("user-1");
  });
});
