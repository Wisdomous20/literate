import { registerAdminUser } from "@/service/auth/registerAdminUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    const result = await registerAdminUser({
      firstName,
      lastName,
      email,
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}