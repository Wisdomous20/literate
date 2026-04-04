"use server";

import { verifyUser } from "@/service/auth/verifyUser";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { sendUserVerificationEmail } from "@/service/notification/sendUserVerificationEmail";
import { prisma } from "@/lib/prisma";

interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

export async function verifyCodeAction(
  userId: string,
  code: string
): Promise<VerifyCodeResult> {
  if (!userId || !code) {
    return { success: false, error: "User ID and verification code are required." };
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return { success: false, error: "Please enter a valid 6-digit code." };
  }

  const result = await verifyUser(code, userId);

  if (!result.success) {
    switch (result.error) {
      case "INVALID_TOKEN":
        return { success: false, error: "Invalid verification code. Please try again." };
      case "TOKEN_EXPIRED":
        return { success: false, error: "Verification code has expired. Please request a new one." };
      case "USER_NOT_FOUND":
        return { success: false, error: "User not found." };
      default:
        return { success: false, error: "Verification failed. Please try again." };
    }
  }

  return { success: true };
}

interface ResendCodeResult {
  success: boolean;
  error?: string;
}

export async function resendVerificationCodeAction(
  userId: string
): Promise<ResendCodeResult> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, isVerified: true },
    });

    if (!user || !user.email) {
      return { success: false, error: "User not found." };
    }

    if (user.isVerified) {
      return { success: false, error: "Email is already verified." };
    }

    // Generate new 6-digit code
    const tokenResult = await generateVerificationToken(userId);

    if (!tokenResult.success || !tokenResult.token) {
      return { success: false, error: "Failed to generate verification code." };
    }

    // Send email
    await sendUserVerificationEmail({
      to: user.email,
      userName: user.firstName || "User",
      verificationCode: tokenResult.token,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to resend verification code:", error);
    return { success: false, error: "Failed to send verification code. Please try again." };
  }
}