"use server";

import { sendPasswordResetEmail } from "@/service/notification/sendPasswordResetEmail";
import { createPasswordResetToken } from "@/service/auth/validatePasswordResetService";
import { getFirstZodErrorMessage } from "@/lib/validation/common";
import { sendResetPasswordSchema } from "@/lib/validation/auth";

export async function sendResetPasswordAction(email: string) {
  try {
    const validationResult = sendResetPasswordSchema.safeParse({ email });

    if (!validationResult.success) {
      return {
        success: false,
        message: getFirstZodErrorMessage(validationResult.error),
      };
    }

    const normalizedEmail = validationResult.data.email.toLowerCase();
    const token = await createPasswordResetToken(normalizedEmail);
    await sendPasswordResetEmail(normalizedEmail, token);
    return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, message: "An unexpected error occurred. Please try again later." };
  } 
}
