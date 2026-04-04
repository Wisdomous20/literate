import { prisma } from "@/lib/prisma";
import { validateVerificationToken, deleteVerificationToken } from "@/service/auth/generateVerificationToken";

interface VerifyUserResult {
  success: boolean;
  error?: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function verifyUser(
  token: string,
  userId: string
): Promise<VerifyUserResult> {
  try {
    const tokenResult = await validateVerificationToken(userId, token);

    if (!tokenResult.valid) {
      return { success: false, error: "INVALID_TOKEN" };
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    // Clean up the token from Redis
    await deleteVerificationToken(userId);

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "INTERNAL_ERROR" };
  }
}