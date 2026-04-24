import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  confirmPasswordChangeSchema,
  requestPasswordChangeSchema,
} from "@/lib/validation/auth";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import {
  generateVerificationToken,
  validateVerificationToken,
  deleteVerificationToken,
} from "@/service/auth/generateVerificationToken";
import { sendPasswordChangeVerificationEmail } from "@/service/notification/sendPasswordChangeVerificationEmail";

// Step 1: Verify current password and send code
export async function requestPasswordChangeService(
  userId: string,
  currentPassword: string
) {
  const validationResult = requestPasswordChangeSchema.safeParse({
    currentPassword,
  });
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }
  const { currentPassword: validatedPassword } = validationResult.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true, firstName: true },
  });

  if (!user?.password || !user.email) {
    return { success: false, error: "User not found" };
  }

  const isValid = await bcrypt.compare(validatedPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }

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
  const validationResult = confirmPasswordChangeSchema.safeParse({
    code,
    newPassword,
  });
  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
    };
  }
  const { code: validatedCode, newPassword: validatedPassword } =
    validationResult.data;

  const tokenResult = await validateVerificationToken(userId, validatedCode);
  if (!tokenResult.valid) {
    return { success: false, error: tokenResult.error || "Invalid verification code" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (user?.password) {
    const isSame = await bcrypt.compare(validatedPassword, user.password);
    if (isSame) {
      return { success: false, error: "New password must be different from current password" };
    }
  }

  const hashed = await bcrypt.hash(validatedPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  await deleteVerificationToken(userId);

  return { success: true };
}
