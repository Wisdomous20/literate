"use server";

import { sendPasswordResetEmail } from "@/service/notification/sendPasswordResetEmail";
import { createPasswordResetToken } from "@/service/auth/validatePasswordResetService";

export async function sendResetPasswordAction(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const token = await createPasswordResetToken(normalizedEmail);
    await sendPasswordResetEmail(normalizedEmail, token);
    return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, message: "An unexpected error occurred. Please try again later." };
  } 
}