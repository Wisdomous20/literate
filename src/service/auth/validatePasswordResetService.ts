import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 1

export function generateResetToken(): string {
  return randomBytes(32).toString("hex")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createPasswordResetToken(email: string): Promise<string> {
  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  })

  const token = generateResetToken()
  const hashedToken = hashToken(token)

  await prisma.passwordResetToken.create({
    data: {
      email,
      token: hashedToken,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  })

  // Return the raw token (sent via email), store the hashed version
  return token
}

export async function validatePasswordResetToken(token: string) {
  const hashedToken = hashToken(token)

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  })

  if (!resetToken) {
    return { valid: false, error: "Invalid token" } as const
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    })
    return { valid: false, error: "Token has expired" } as const
  }

  return { valid: true, email: resetToken.email } as const
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  const hashedToken = hashToken(token)
  await prisma.passwordResetToken.deleteMany({
    where: { token: hashedToken },
  })
}