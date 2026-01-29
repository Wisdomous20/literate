"use server";

import { registerUser } from "@/service/auth/registerUser";
import { sendUserVerificationEmail } from "@/service/notification/sendUserVerificationEmail";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { RegisterUserInput } from "@/types/auth";
import { createClassService } from "@/service/class/createClassService";


export async function registerUserAction(input: RegisterUserInput) {
  // 1. Register user
  const result = await registerUser(input);

  if (!result.success || !result.user) {
    return result;
  }

  // 2. Generate verification token
  const tokenResult = await generateVerificationToken(result.user.id);

  if (tokenResult.success && tokenResult.token) {
    // 3. Send verification email (NON-BLOCKING)
    sendUserVerificationEmail({
      to: input.email,
      userName: input.firstName,
      userId: result.user.id,
      verificationToken: tokenResult.token,
    }).catch((error) => {
      console.error("Failed to send verification email:", error);
    });
  }

  try{
    await createClassService({
      name: 'My Class',
      userId: result.user.id,
    });
  }catch(error){
    console.error("Failed to create default class for user:", error);
  }

  return result;
}