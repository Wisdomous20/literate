import { prisma } from "@/lib/prisma";

const VERIFICATION_WINDOW_MINUTES = Number(
  process.env.VERIFICATION_WINDOW_MINUTES || 15
);

interface GenerateVerificationTokenResult {
  success: boolean;
  token?: string;
  expires?: Date;
  error?: string;
}

export async function generateVerificationToken(
  userId: string
): Promise<GenerateVerificationTokenResult> {
  try {
    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId },
    });

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + VERIFICATION_WINDOW_MINUTES * 60000);

    await prisma.verificationToken.create({
      data: {
        userId,
        token: code,
        expires,
      },
    });

    return { success: true, token: code, expires };
  } catch (error) {
    console.error("Failed to generate verification token:", error);
    return { success: false, error: "Failed to generate verification token" };
  }
}