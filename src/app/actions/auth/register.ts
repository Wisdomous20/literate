"use server";

import { registerUser } from "@/service/auth/registerUser";
import { loginUser } from "@/service/auth/login";
import { sendEmailVerificationCode } from "@/service/auth/sendEmailVerificationCode";
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
    if (result.code === "USER_EXISTS") {
      const loginResult = await loginUser({
        email: validatedInput.email,
        password: validatedInput.password,
      });

      if (
        !loginResult.success &&
        loginResult.code === "EMAIL_NOT_VERIFIED" &&
        loginResult.user?.id &&
        loginResult.user.email
      ) {
        const emailResult = await sendEmailVerificationCode({
          userId: loginResult.user.id,
          email: loginResult.user.email,
          userName: loginResult.user.firstName || "User",
          purpose: "ACCOUNT_VERIFICATION",
        });

        return {
          success: true,
          user: loginResult.user,
          emailSent: emailResult.success,
          emailError: emailResult.success ? undefined : emailResult.error,
        };
      }
    }

    return result;
  }

  // 2. Await SMTP acceptance before telling the user a code was sent.
  const emailResult = await sendEmailVerificationCode({
    userId: result.user.id,
    email: validatedInput.email,
    userName: validatedInput.firstName,
    purpose: "ACCOUNT_VERIFICATION",
  });

  try {
    await createClassService({
      name: "My Class",
      userId: result.user.id,
    });
  } catch (error) {
    console.error("Failed to create default class for user:", error);
  }

  // Keep the new account recoverable when SMTP is unavailable: the UI can show
  // the send error and let the user retry instead of claiming the code arrived.
  return {
    ...result,
    emailSent: emailResult.success,
    emailError: emailResult.success ? undefined : emailResult.error,
  };
}
