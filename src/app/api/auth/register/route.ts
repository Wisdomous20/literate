import { registerUser } from "@/service/auth/registerUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    const result = await registerUser({ name, email, password });

    if (!result.success) {
      const statusCode = 
        result.code === "VALIDATION_ERROR" ? 400 :
        result.code === "USER_EXISTS" ? 409 : 500;

      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}