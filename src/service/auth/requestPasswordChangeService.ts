import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { sendPasswordChangeVerificationEmail } from "@/service/notification/sendPasswordChangeVerificationEmail";

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

  // Generate and send 6-digit code
  const tokenResult = await generateVerificationToken(userId);

  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, error: "Failed to generate verification code" };
  }

  await sendPasswordChangeVerificationEmail({
    to: user.email,
    userName: user.firstName || "User",
    verificationCode: tokenResult.token,
  });

  return { success: true };
}

// Step 2: Verify code and change password
export async function confirmPasswordChangeService(
  userId: string,
  code: string,
  newPassword: string
) {
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return { success: false, error: "Invalid verification code" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters" };
  }

  // Verify the code
  const token = await prisma.verificationToken.findFirst({
    where: { userId, token: code },
  });

  if (!token) {
    return { success: false, error: "Invalid verification code" };
  }

  if (token.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { id: token.id } });
    return { success: false, error: "Verification code has expired" };
  }

  // Check new password isn't the same as current
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

  // Update password and clean up token
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    }),
    prisma.verificationToken.deleteMany({
      where: { userId },
    }),
  ]);

  return { success: true };
}