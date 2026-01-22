import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

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

    // Generate new token
    const token = randomBytes(16).toString("hex");
    const expires = new Date(Date.now() + VERIFICATION_WINDOW_MINUTES * 60000);

    await prisma.verificationToken.create({
      data: {
        userId,
        token,
        expires,
      },
    });

    return { success: true, token, expires };
  } catch (error) {
    console.error("Failed to generate verification token:", error);
    return { success: false, error: "Failed to generate verification token" };
  }
}