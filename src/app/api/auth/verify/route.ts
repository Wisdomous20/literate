import { verifyUser } from "@/service/auth/verifyUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: "Verification code and user ID are required." },
        { status: 400 }
      );
    }

    const result = await verifyUser(code, userId);

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        INVALID_TOKEN: "Invalid verification code.",
        TOKEN_EXPIRED: "Verification code has expired.",
        USER_NOT_FOUND: "User not found.",
        INTERNAL_ERROR: "An internal error occurred.",
      };

      return NextResponse.json(
        { success: false, error: errorMessages[result.error || "INTERNAL_ERROR"] },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}