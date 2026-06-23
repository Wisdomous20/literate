import { getRedis } from "@/lib/redis";
import { randomInt } from "node:crypto";

const configuredWindowMinutes = Number(process.env.VERIFICATION_WINDOW_MINUTES);
const VERIFICATION_WINDOW_MINUTES =
  Number.isFinite(configuredWindowMinutes) && configuredWindowMinutes > 0
    ? configuredWindowMinutes
    : 15;

const verificationKey = (userId: string) => `verification:${userId}`;

export interface VerificationTokenResult {
  success: boolean;
  token?: string;
  error?: string;
  rollback?: () => Promise<void>;
}

export async function generateVerificationToken(
  userId: string,
): Promise<VerificationTokenResult> {
  try {
    const redis = getRedis();
    const key = verificationKey(userId);
    const previousToken = await redis.get(key);
    const previousTtl = previousToken ? await redis.ttl(key) : -1;
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const ttl = VERIFICATION_WINDOW_MINUTES * 60;

    await redis.set(key, code, "EX", ttl);

    return {
      success: true,
      token: code,
      rollback: async () => {
        const currentToken = await redis.get(key);
        if (currentToken !== code) return;

        if (previousToken && previousTtl > 0) {
          await redis.set(key, previousToken, "EX", previousTtl);
        } else {
          await redis.del(key);
        }
      },
    };
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
