import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An error occurred during signup" },
      { status: 500 }
    );
  }
}
