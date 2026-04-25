"use server";

import { registerUser } from "@/service/auth/registerUser";
import { sendUserVerificationEmail } from "@/service/notification/sendUserVerificationEmail";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { RegisterUserInput } from "@/types/auth";
import { createClassService } from "@/service/class/createClassService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { registerUserSchema } from "@/lib/validation/auth";

export async function registerUserAction(input: RegisterUserInput) {
  const validationResult = registerUserSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodErrorMessage(validationResult.error),
      code: "VALIDATION_ERROR" as const,
    };
  }

  const validatedInput = validationResult.data;

  // 1. Register user
  const result = await registerUser(validatedInput);

  if (!result.success || !result.user) {
    return result;
  }

  // 2. Generate verification token (6-digit code)
  const tokenResult = await generateVerificationToken(result.user.id);

  if (tokenResult.success && tokenResult.token) {
    // 3. Send verification email with code (NON-BLOCKING)
    sendUserVerificationEmail({
      to: validatedInput.email,
      userName: validatedInput.firstName,
      verificationCode: tokenResult.token,
    }).catch((error) => {
      console.error("Failed to send verification email:", error);
    });
  }

  try {
    await createClassService({
      name: "My Class",
      userId: result.user.id,
    });
  } catch (error) {
    console.error("Failed to create default class for user:", error);
  }

  // Return userId so the frontend can use it for code verification
  return result;
}
