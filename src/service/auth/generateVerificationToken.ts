import { getRedis } from "@/lib/redis";

const VERIFICATION_WINDOW_MINUTES = Number(
  process.env.VERIFICATION_WINDOW_MINUTES || 15
);

export async function generateVerificationToken(userId: string) {
  try {
    const redis = getRedis();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = VERIFICATION_WINDOW_MINUTES * 60;

    await redis.set(
      `verification:${userId}`,
      code,
      "EX",
      ttl
    );

    return { success: true, token: code };
  } catch (error) {
    console.error("Failed to generate verification token:", error);
    return { success: false, error: "Failed to generate verification token" };
  }
}

export async function validateVerificationToken(userId: string, code: string) {
  const redis = getRedis();
  const stored = await redis.get(`verification:${userId}`);

  if (!stored || stored !== code) {
    return { valid: false, error: "Invalid verification code" };
  }

  return { valid: true };
}

export async function deleteVerificationToken(userId: string) {
  const redis = getRedis();
  await redis.del(`verification:${userId}`);
}