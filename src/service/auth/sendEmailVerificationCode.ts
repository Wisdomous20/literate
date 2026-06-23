import { getRedis } from "@/lib/redis";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { sendUserVerificationEmail } from "@/service/notification/sendUserVerificationEmail";
import { sendPasswordChangeVerificationEmail } from "@/service/notification/sendPasswordChangeVerificationEmail";

const RESEND_COOLDOWN_SECONDS = 60;

type VerificationPurpose = "ACCOUNT_VERIFICATION" | "PASSWORD_CHANGE";

interface SendEmailVerificationCodeInput {
  userId: string;
  email: string;
  userName: string;
  purpose: VerificationPurpose;
}

export interface SendEmailVerificationCodeResult {
  success: boolean;
  error?: string;
  code?: "RATE_LIMITED" | "TOKEN_ERROR" | "EMAIL_SEND_FAILED";
}

function sendLockKey(userId: string, purpose: VerificationPurpose): string {
  return `verification-send:${purpose}:${userId}`;
}

/**
 * Issues and sends an OTP as one operation. The previous code is restored when
 * SMTP rejects the new message, preventing a failed resend from invalidating a
 * code that the user already received.
 */
export async function sendEmailVerificationCode(
  input: SendEmailVerificationCodeInput,
): Promise<SendEmailVerificationCodeResult> {
  const redis = getRedis();
  const lockKey = sendLockKey(input.userId, input.purpose);

  try {
    const acquired = await redis.set(
      lockKey,
      "1",
      "EX",
      RESEND_COOLDOWN_SECONDS,
      "NX",
    );
    if (acquired !== "OK") {
      return {
        success: false,
        code: "RATE_LIMITED",
        error: "Please wait one minute before requesting another code.",
      };
    }
  } catch (error) {
    console.error("Failed to apply verification-code rate limit:", error);
    return {
      success: false,
      code: "TOKEN_ERROR",
      error: "Unable to request a verification code. Please try again.",
    };
  }

  const tokenResult = await generateVerificationToken(input.userId);
  if (!tokenResult.success || !tokenResult.token) {
    await redis.del(lockKey).catch(() => undefined);
    return {
      success: false,
      code: "TOKEN_ERROR",
      error: "Unable to generate a verification code. Please try again.",
    };
  }

  try {
    if (input.purpose === "PASSWORD_CHANGE") {
      await sendPasswordChangeVerificationEmail({
        to: input.email,
        userName: input.userName,
        verificationCode: tokenResult.token,
      });
    } else {
      await sendUserVerificationEmail({
        to: input.email,
        userName: input.userName,
        verificationCode: tokenResult.token,
      });
    }

    return { success: true };
  } catch (error) {
    await tokenResult.rollback?.().catch(() => undefined);
    await redis.del(lockKey).catch(() => undefined);
    console.error("Verification email was not accepted by SMTP:", {
      purpose: input.purpose,
      userId: input.userId,
      error:
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "UNKNOWN")
          : "UNKNOWN",
    });
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      error: "We could not send the verification code. Please try again.",
    };
  }
}
