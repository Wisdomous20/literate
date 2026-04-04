import { randomBytes, createHash } from "crypto";
import { getRedis } from "@/lib/redis";

const TOKEN_EXPIRY_SECONDS = 60 * 60; // 1 hour

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const redis = getRedis();
  const token = generateResetToken();
  const hashedToken = hashToken(token);

  const existingHash = await redis.get(`password-reset-lookup:${email}`);
  if (existingHash) {
    await redis.del(`password-reset:${existingHash}`);
    await redis.del(`password-reset-lookup:${email}`);
  }

  await redis.set(`password-reset:${hashedToken}`, email, "EX", TOKEN_EXPIRY_SECONDS);
  await redis.set(`password-reset-lookup:${email}`, hashedToken, "EX", TOKEN_EXPIRY_SECONDS);

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const redis = getRedis();
  const hashedToken = hashToken(token);
  const email = await redis.get(`password-reset:${hashedToken}`);

  if (!email) {
    return { valid: false, error: "Invalid or expired token" } as const;
  }

  return { valid: true, email } as const;
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  const redis = getRedis();
  const hashedToken = hashToken(token);
  const email = await redis.get(`password-reset:${hashedToken}`);

  await redis.del(`password-reset:${hashedToken}`);
  if (email) {
    await redis.del(`password-reset-lookup:${email}`);
  }
}