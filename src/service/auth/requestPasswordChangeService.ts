import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  validateVerificationToken,
  deleteVerificationToken,
} from "@/service/auth/generateVerificationToken";
import { sendEmailVerificationCode } from "@/service/auth/sendEmailVerificationCode";

// Step 1: Verify current password and send code
export async function requestPasswordChangeService(
  userId: string,
  currentPassword: string
) {
  if (!currentPassword) {
    return { success: false, error: "Current password is required" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true, firstName: true },
  });

  if (!user?.password || !user.email) {
    return { success: false, error: "User not found" };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

  const emailResult = await sendEmailVerificationCode({
    userId,
    email: user.email,
    userName: user.firstName || "User",
    purpose: "PASSWORD_CHANGE",
  });

  return emailResult.success
    ? { success: true }
    : { success: false, error: emailResult.error };
}

// Step 2: Verify code and change password
export async function confirmPasswordChangeService(
  userId: string,
  code: string,
  newPassword: string
) {
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Please enter a valid 6-digit code." };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters long",
    };
  }

  const tokenResult = await validateVerificationToken(userId, code);
  if (!tokenResult.valid) {
    return { success: false, error: tokenResult.error || "Invalid verification code" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (user?.password) {
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return { success: false, error: "New password must be different from current password" };
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  await deleteVerificationToken(userId);

  return { success: true };
}
