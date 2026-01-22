import { prisma } from "@/lib/prisma";

interface VerifyUserResult {
  success: boolean;
  error?: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "USER_NOT_FOUND" | "INTERNAL_ERROR";
}

export async function verifyUser(
  token: string,
  userId: string
): Promise<VerifyUserResult> {
  try {
    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord || verificationRecord.userId !== userId) {
      return { success: false, error: "INVALID_TOKEN" };
    }

    if (new Date() > verificationRecord.expires) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { success: false, error: "TOKEN_EXPIRED" };
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "INTERNAL_ERROR" };
  }
}