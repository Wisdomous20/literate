import { registerUser } from "@/service/auth/registerUser";
import { generateVerificationToken } from "@/service/auth/generateVerificationToken";
import { sendUserVerificationEmail } from "@/service/notification/sendUserVerificationEmail";
import { NextResponse } from "next/server";

// ⚠️ DELETE THIS FILE AFTER TESTING
export async function POST(req: Request) {
  const input = await req.json();

  // 1. Register user
  const result = await registerUser(input);

  if (!result.success || !result.user) {
    return NextResponse.json(result, { status: 400 });
  }

  // 2. Generate verification token
  const tokenResult = await generateVerificationToken(result.user.id);

  if (tokenResult.success && tokenResult.token) {
    // 3. Send verification email (NON-BLOCKING - no await!)
    sendUserVerificationEmail({
      to: input.email,
      userName: input.name,
      userId: result.user.id,
      verificationToken: tokenResult.token,
    }).catch((error) => {
      console.error("Failed to send verification email:", error);
    });
  }

  // Return immediately, email sends in background
  return NextResponse.json(result);
}