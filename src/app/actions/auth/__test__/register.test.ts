import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRegisterUser = vi.hoisted(() => vi.fn());
const mockLoginUser = vi.hoisted(() => vi.fn());
const mockSendEmailVerificationCode = vi.hoisted(() => vi.fn());
const mockCreateClass = vi.hoisted(() => vi.fn());

vi.mock("@/service/auth/registerUser", () => ({ registerUser: mockRegisterUser }));
vi.mock("@/service/auth/login", () => ({ loginUser: mockLoginUser }));
vi.mock("@/service/auth/sendEmailVerificationCode", () => ({
  sendEmailVerificationCode: mockSendEmailVerificationCode,
}));
vi.mock("@/service/class/createClassService", () => ({
  createClassService: mockCreateClass,
}));

import { registerUserAction } from "../register";

const user = {
  id: "user-1",
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  createdAt: new Date(),
};

describe("registerUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterUser.mockResolvedValue({ success: true, user });
    mockCreateClass.mockResolvedValue({ success: true });
  });

  it("does not claim that an OTP was sent when SMTP delivery fails", async () => {
    mockSendEmailVerificationCode.mockResolvedValue({
      success: false,
      error: "We could not send the verification code. Please try again.",
    });

    const result = await registerUserAction({
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      password: "password123",
    });

    expect(result).toMatchObject({
      success: true,
      user: { id: "user-1" },
      emailSent: false,
      emailError: "We could not send the verification code. Please try again.",
    });
    expect(mockSendEmailVerificationCode).toHaveBeenCalledWith({
      userId: "user-1",
      email: "juan@example.com",
      userName: "Juan",
      purpose: "ACCOUNT_VERIFICATION",
    });
  });

  it("resumes email verification only after the existing user proves their password", async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      code: "USER_EXISTS",
      error: "User with this email already exists",
    });
    mockLoginUser.mockResolvedValue({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      user,
    });
    mockSendEmailVerificationCode.mockResolvedValue({ success: true });

    const result = await registerUserAction({
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      password: "password123",
    });

    expect(result).toMatchObject({
      success: true,
      user: { id: "user-1" },
      emailSent: true,
    });
    expect(mockLoginUser).toHaveBeenCalledWith({
      email: "juan@example.com",
      password: "password123",
    });
  });
});
