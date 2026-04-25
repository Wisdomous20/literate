import { verifyUser } from "@/service/auth/verifyUser";
import { NextRequest, NextResponse } from "next/server";
import { verifyCodeInputSchema } from "@/lib/validation/auth";
import { getFirstZodErrorMessage } from "@/lib/validation/common";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = verifyCodeInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: getFirstZodErrorMessage(validationResult.error),
        },
        { status: 400 }
      );
    }

    const { code, userId } = validationResult.data;

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
